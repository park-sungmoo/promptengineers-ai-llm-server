// https://chatgpt.com/share/9da3c401-7e86-4ad9-a635-2729a0d015d5
import { API_URL, ON_PREM } from "@/config/app";
import { Default } from "@/config/default";
import { useAppContext } from "@/contexts/AppContext";
import { LLM, Message } from "@/types/chat";
import { EmbeddingModel, ModelType, SearchProvider, SearchType, acceptRagSystemMessage } from "@/types/llm";
import { ChatClient } from "@/utils/api";
import { combinePrompts, parseCSV, shallowUrl } from "@/utils/chat";
import { log } from "@/utils/log";
import { useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { SSE } from "sse.js";

const chatClient = new ChatClient();

export const defaultState = {
    chatInputRef: null,
    chatboxRef: null,
    userInputRef: null,
    responseRef: "",
    response: "",
    userInput: "",
    models: [],
    chats: [],
    messages: [],
    images: [],
    files: [],
    expand: false,
    done: true,
    selectedImage: null,
    selectedDocument: null,
    csvContent: null,
    isSaveEnabled: false,
    chatPayload: {
        query: "",
        history_id: "",
        system: Default.SYSTEM_MESSAGE,
        model: ON_PREM
            ? ModelType.OLLAMA_LLAMA_3_CHAT
            : ModelType.OPENAI_GPT_4_OMNI,
        temperature: 0.5,
        tools: [],
        retrieval: {
            provider: SearchProvider.REDIS,
            embedding: ON_PREM
                ? EmbeddingModel.OLLAMA_NOMIC_EMBED_TEXT
                : EmbeddingModel.OPENAI_TEXT_EMBED_3_LARGE,
            index_name: "",
            search_type: SearchType.MMR,
            search_kwargs: {
                k: 20,
                fetch_k: null,
                score_threshold: null,
            },
        },
    },
};

export const useChatState = () => {
    const {setLoading} = useAppContext();
    const searchParams = useSearchParams();
    const chatInputRef = useRef<HTMLInputElement | null>(defaultState.chatInputRef);
    const chatboxRef = useRef<HTMLInputElement | null>(defaultState.chatboxRef);
    const userInputRef = useRef<HTMLInputElement | null>(defaultState.userInputRef);
    const responseRef = useRef(defaultState.responseRef);
    const [done, setDone] = useState(defaultState.done);
    const [expand, setExpand] = useState(defaultState.expand);
    const [isSaveEnabled, setIsSaveEnabled] = useState(defaultState.isSaveEnabled);
    const [selectedImage, setSelectedImage] = useState<string | null>(defaultState.selectedImage);
    const [selectedDocument, setSelectedDocument] = useState<any | null>(defaultState.selectedDocument);
    const [csvContent, setCsvContent] = useState<string[][] | null>(defaultState.csvContent);
    const [chats, setChats] = useState<any[]>(defaultState.chats);
    const [messages, setMessages] = useState<Message[]>(defaultState.messages);
    const [images, setImages] = useState<any[]>(defaultState.images);
    const [files, setFiles] = useState<any[]>(defaultState.files);
    const [userInput, setUserInput] = useState(defaultState.userInput);
    const [response, setResponse] = useState(defaultState.response);
    const [models, setModels] = useState<LLM[]>(defaultState.models);
    const [chatPayload, setChatPayload] = useState(defaultState.chatPayload);
    const [initChatPayload, setInitChatPayload] = useState({
        system: chatPayload.system,
        retrieval: chatPayload.retrieval,
        tools: chatPayload.tools,
    });

    const fetchModels = async () => {
        const res = await chatClient.listModels();
        setModels(
            res.models.sort((a: LLM, b: LLM) =>
                a.model_name.localeCompare(b.model_name)
            )
        );
    };

    const fetchChats = async () => {
        try {
            const data = await chatClient.list();
            setChats(data.chats);
        } catch (err) {
            alert(err);
            console.error(err);
        }
    };

    const deleteChat = async (chatId: string) => {
        // Ask for confirmation before deleting
        const confirmDelete = confirm(
            "Are you sure you want to delete this chat?"
        );
        if (!confirmDelete) {
            return; // If user clicks 'Cancel', exit the function
        }

        try {
            await chatClient.delete(chatId);
            setChats(chats.filter((chat) => chat.id !== chatId));
            if (chatId === chatPayload.history_id) {
                setMessages([]);
            }
        } catch (err) {
            alert(err); // Display error message from the exception
            console.error(err);
        }
    };

    const handleImageClick = (src: string) => {
        setSelectedImage(src);
    };

    const sendChatPayload = async (event: any) => {
        event.preventDefault();

        const messageContent: Message = { role: "user", content: userInput };

        if (images.length > 0) {
            messageContent.images = images.map((image) => image.src);
        }

        if (files.length > 0) {
            messageContent.sources = files.map((file) => file);
        }

        setMessages([...messages, messageContent]);
        setImages([]);
    };

    const handleRegenerateClick = (index: number) => {
        if (index === 0) {
            alert("Cannot regenerate from the first message.");
            return;
        }

        // Update chatPayload with the content of the message just before the clicked one
        const messageAtIndex = messages[index - 1];
        const newMessages = messages.slice(0, index - 1);
        setMessages(newMessages);

        setTimeout(() => {
            // setMessages([...newMessages, messageAtIndex]);
            setUserInput(messageAtIndex.content);
            // submitQuestionStream();
        }, 200);
    };

    const resetChat = (event: any) => {
        event.preventDefault();
        setUserInput("");
        shallowUrl("/chat");
        setMessages([]);
        setChatPayload({
            ...chatPayload,
            query: "",
            history_id: "",
            retrieval: {
                ...chatPayload.retrieval,
                index_name: "",
            },
        });
        setDone(true);
    };

    const handleDocumentClick = async (messageIndex: number, source: any) => {
        if (selectedDocument || csvContent) {
            setSelectedDocument(null);
            setCsvContent(null);
            return;
        } else {
            if (source.type === "text/plain") {
                try {
                    const response = await fetch(source.src);
                    const text = await response.text();
                    const blob = new Blob([text], { type: "text/plain" });
                    const blobUrl = URL.createObjectURL(blob);
                    setSelectedDocument(blobUrl);
                    setCsvContent(null);
                } catch (error) {
                    console.error("Failed to fetch text content:", error);
                }
            } else if (source.type === "text/csv") {
                try {
                    const response = await fetch(source.src);
                    const text = await response.text();
                    const parsedCSV = parseCSV(text);
                    setCsvContent(parsedCSV);
                    setSelectedDocument(null);
                } catch (error) {
                    console.error("Failed to fetch CSV content:", error);
                }
            } else {
                setSelectedDocument({ ...source, id: messageIndex });
                setCsvContent(null);
            }
        }
    };

    const submitCleanUp = () => {
        setChatPayload({ ...chatPayload, query: "" });
        setUserInput("");
        chatInputRef.current?.focus();
    };

    async function updateMessages(
        system: string,
        messages: Message[],
        retrieval?: any,
        tools?: string[]
    ) {
        if (!chatPayload.history_id) {
            const history = await chatClient.create({
                system,
                messages,
                retrieval,
                tools,
            });
            log("contexts.ChatContext.updateCallback", history, "Created");
            setChatPayload({
                ...chatPayload,
                query: "",
                history_id: history.chat.id,
            });
            let updatedUrl = `/chat/${history.chat.id}`;
            if (searchParams.toString()) {
                updatedUrl += `?${searchParams.toString()}`;
            }
            shallowUrl(updatedUrl);
        } else {
            const history = await chatClient.update(chatPayload.history_id, {
                system,
                messages,
                retrieval,
                tools,
            });
            log("contexts.ChatContext.updateCallback", history, "Updated");
        }
        chatInputRef.current?.focus();
        fetchChats();
    }

    const adjustHeight = (height?: string) => {
        const textarea = chatInputRef.current as unknown as HTMLTextAreaElement; // Type assertion
        if (textarea) {
            textarea.style.height = "auto";
            textarea.style.height = height
                ? height
                : `${textarea.scrollHeight}px`;
        }
    };

    const submitQuestionStream = async () => {
        try {
            setDone(false);
            setLoading(true);
            responseRef.current = "";
            setResponse("");
            submitCleanUp();

            const config = {
                model: chatPayload.model,
                messages:
                    chatPayload.retrieval.index_name &&
                    !acceptRagSystemMessage.has(chatPayload.model)
                        ? messages
                        : combinePrompts(chatPayload, messages, userInput),
                tools: chatPayload.tools,
                retrieval: chatPayload.retrieval,
                temperature: chatPayload.temperature,
                streaming: true,
            };

            const source = new SSE(API_URL + "/api/v1/chat", {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`, // set this yourself
                },
                payload: JSON.stringify(config),
            });

            source.addEventListener("error", (e: any) => {
                console.error("Error received from server:", e);
                alert(JSON.parse(e.data).detail);
                setLoading(false);
                setDone(true);
                source.close();
                return;
            });

            const tempAssistantMessage = {
                role: "assistant",
                content: "",
                model: chatPayload.model,
            };
            const updatedMessages = [...messages, tempAssistantMessage];
            setMessages(updatedMessages);
            const tempIndex = updatedMessages.length - 1;

            source.addEventListener("message", (e: any) => {
                const jsonObjectsRegExp = /{[\s\S]+?}(?=data:|$)/g;
                const jsonObjectsMatches = e.data.match(jsonObjectsRegExp);

                if (jsonObjectsMatches) {
                    const objectsArray = jsonObjectsMatches.map((json: any) =>
                        JSON.parse(json)
                    );

                    if (objectsArray) {
                        if (
                            objectsArray[0].type === "stream" ||
                            objectsArray[0].type === "end"
                        ) {
                            responseRef.current += objectsArray[0].message;
                            setLoading(false);
                            setResponse(responseRef.current);
                            if (objectsArray[0].type === "end") {
                                // Replace the temporary message with the actual response
                                const finalMessages = [...updatedMessages];
                                finalMessages[tempIndex] = {
                                    role: "assistant",
                                    content: responseRef.current,
                                    model: chatPayload.model,
                                };
                                setMessages(finalMessages);

                                updateMessages(
                                    chatPayload.system,
                                    finalMessages,
                                    chatPayload.retrieval,
                                    chatPayload.tools
                                );
                                setDone(true);
                            }
                        }

                        if (objectsArray[0].type === "doc") {
                            console.log(objectsArray[0].message);
                        }
                    }
                } else {
                    source.close();
                    setLoading(false);
                    setDone(true);
                }
            });

            source.stream();
        } catch (error) {
            console.error("An unexpected error occurred:", error);
            alert("An unexpected error occurred. Please try again later.");
            setLoading(false);
            setDone(true);
        }
    };

    return {
        // Refs
        chatInputRef,
        chatboxRef,
        userInputRef,
        responseRef,
        // States
        done,
        setDone,
        expand,
        setExpand,
        response,
        setResponse,
        isSaveEnabled,
        setIsSaveEnabled,
        selectedImage,
        setSelectedImage,
        selectedDocument,
        setSelectedDocument,
        csvContent,
        setCsvContent,
        chats,
        setChats,
        messages,
        setMessages,
        images,
        setImages,
        files,
        setFiles,
        userInput,
        setUserInput,
        models,
        setModels,
        chatPayload,
        setChatPayload,
        initChatPayload,
        setInitChatPayload,
        // Mutations
        fetchModels,
        fetchChats,
        deleteChat,
        handleImageClick,
        sendChatPayload,
        handleRegenerateClick,
        resetChat,
        handleDocumentClick,
        submitCleanUp,
        updateMessages,
        adjustHeight,
        submitQuestionStream,
    };
};
