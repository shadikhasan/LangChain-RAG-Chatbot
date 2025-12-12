import hashlib
from pathlib import Path
from typing import List, Optional, Tuple
from operator import itemgetter

from django.conf import settings

from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnableLambda

from langchain_community.vectorstores import FAISS


def load_documents(file_paths: List[Path]):
    """Load documents from different file types (without LangChain loaders)."""
    from pypdf import PdfReader
    import docx2txt

    documents: List[Document] = []

    for path in file_paths:
        suffix = path.suffix.lower()
        text = ""

        if suffix == ".pdf":
            reader = PdfReader(str(path))
            for page in reader.pages:
                page_text = page.extract_text() or ""
                text += page_text + "\n"

        elif suffix in [".txt", ".md"]:
            text = path.read_text(encoding="utf-8")

        elif suffix in [".docx", ".doc"]:
            text = docx2txt.process(str(path))

        else:
            raise ValueError(f"Unsupported file type: {suffix}")

        text = text.strip()
        if not text:
            continue

        documents.append(
            Document(
                page_content=text,
                metadata={"source": str(path)},
            )
        )

    return documents


def get_embeddings(model_hint: Optional[str] = None):
    """Return HuggingFace embeddings."""
    from langchain_community.embeddings import HuggingFaceEmbeddings

    return HuggingFaceEmbeddings(
        model_name=model_hint or "sentence-transformers/all-MiniLM-L6-v2"
    )


def build_vectorstore(file_paths: List[Path]) -> Tuple[FAISS, Path]:
    """Build FAISS vectorstore from documents."""
    documents = load_documents(file_paths)
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    split_docs = splitter.split_documents(documents)
    embeddings = get_embeddings()
    vectorstore = FAISS.from_documents(split_docs, embeddings)

    # Save with unique digest
    sorted_names = "-".join(sorted([p.name for p in file_paths]))
    digest = hashlib.sha256(sorted_names.encode("utf-8")).hexdigest()[:12]
    store_path = Path(settings.VECTORSTORE_ROOT) / f"vs-{digest}"
    vectorstore.save_local(str(store_path))
    return vectorstore, store_path


def load_vectorstore(store_path: Path) -> FAISS:
    """Load FAISS vectorstore from disk."""
    embeddings = get_embeddings()
    return FAISS.load_local(
        str(store_path),
        embeddings,
        allow_dangerous_deserialization=True,
    )


def model_catalog():
    """Return a list of available models."""
    return [
        {"id": "gemini-2.5-flash", "provider": "google", "label": "Google Gemini 2.5 Flash"},
        {"id": "gpt-4", "provider": "openai", "label": "OpenAI GPT-4"},
        {"id": "gpt-3.5-turbo", "provider": "openai", "label": "OpenAI GPT-3.5 Turbo"},
        {"id": "claude-3-haiku", "provider": "anthropic", "label": "Anthropic Claude 3 Haiku"},
        {"id": "gemini-pro", "provider": "google", "label": "Google Gemini Pro"},
        {"id": "llama3-70b-8192", "provider": "groq", "label": "Groq Llama3-70B"},
        {
            "id": "huggingface/mistralai/Mixtral-8x7B-Instruct-v0.1",
            "provider": "huggingface",
            "label": "HuggingFace Inference",
        },
        {"id": "ollama/llama3", "provider": "ollama", "label": "Ollama Llama3 (local)"},
    ]


def get_chat_model(model: str, api_key: str, temperature: float, max_tokens: int):
    """Return the selected chat model instance."""
    provider = None
    for item in model_catalog():
        if item["id"] == model:
            provider = item["provider"]
            break

    if provider == "openai":
        from langchain_openai import ChatOpenAI

        return ChatOpenAI(
            api_key=api_key,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
        )

    if provider == "anthropic":
        from langchain_anthropic import ChatAnthropic

        return ChatAnthropic(
            api_key=api_key,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
        )

    if provider == "google":
        from langchain_google_genai import ChatGoogleGenerativeAI

        return ChatGoogleGenerativeAI(
            model=model,
            google_api_key=api_key,
            temperature=temperature,
            max_output_tokens=max_tokens,
        )

    if provider == "groq":
        from langchain_groq import ChatGroq

        return ChatGroq(
            groq_api_key=api_key,
            model_name=model,
            temperature=temperature,
            max_tokens=max_tokens,
        )

    if provider == "huggingface":
        from langchain_huggingface import ChatHuggingFace, HuggingFaceEndpoint

        # HuggingFace chat models require an underlying text-generation endpoint
        endpoint = HuggingFaceEndpoint(
            repo_id=model,
            huggingfacehub_api_token=api_key,
            temperature=temperature,
            max_new_tokens=max_tokens,
        )
        return ChatHuggingFace(llm=endpoint)

    if provider == "ollama":
        from langchain_ollama import ChatOllama

        # Ollama runs locally; api_key may be unused
        return ChatOllama(model=model.split("/", 1)[-1], temperature=temperature)

    raise ValueError(f"Unsupported model: {model}")


def build_qa_chain(
    model: str,
    api_key: str,
    temperature: float,
    max_tokens: int,
    store_path: Path,
    system_prompt: str,
):
    """Build a retrieval QA runnable chain with the given model and vectorstore.

    Usage:
        chain = build_qa_chain(...)
        answer = chain.invoke({"query": "Your question here"})
    """
    # 1) Load vectorstore + retriever
    vectorstore = load_vectorstore(store_path)
    retriever = vectorstore.as_retriever(search_kwargs={"k": 4})

    def format_docs(docs: List[Document]) -> str:
        return "\n\n".join(doc.page_content for doc in docs)

    # 2) LLM
    llm = get_chat_model(model, api_key, temperature, max_tokens)

    # 3) Prompt
    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                system_prompt
                or "You are a helpful assistant. Use the given context to answer the user's question.",
            ),
            (
                "human",
                "Here is the relevant context:\n\n{context}\n\n"
                "Question: {question}",
            ),
        ]
    )

    # 4) Runnable chain: {"query": "..."} -> answer string
    chain = (
        {
            "question": itemgetter("query"),
            "context": itemgetter("query") | retriever | RunnableLambda(format_docs),
        }
        | prompt
        | llm
        | StrOutputParser()
    )

    return chain
