"use client";
import { useContext, createContext, useMemo } from "react";
import { ChatClient } from "../utils/api";
import { Message } from "../types/chat";
import { IContextProvider } from "../interfaces/provider";
import { ChatPayload } from "@/types/chat";
import { useSearchParams } from "next/navigation";
import { constructBubbleMessage, shallowUrl } from "@/utils/chat";
import { userMessageTitleStyle } from "@/config/message";
import { useAppContext } from "./AppContext";
import DocumentSection from "@/components/sections/DocumentSection";
import { useChatState } from "@/hooks/state/useChatState";
import ResponseToolBar from "@/components/sections/ResponseToolBar";
import MarkdownCard from "@/components/cards/MarkdownCard";
import ImageList from "@/components/lists/ImageList";
import SourceList from "@/components/lists/SourceList";
import {
    useFetchModelsEffect,
    useCheckIfSaveEnabledEffect,
    useUpdateMessageOnResponesEffect,
    useSubmitQuestionStreamEffect,
    usePrintActionsToLogsEffect,
} from "@/hooks/effect/useChatEffects";
import ActionDisclosure from "@/components/disclosures/ActionDisclosure";

const ChatContext = createContext({});
export default function ChatProvider({ children }: IContextProvider) {
    const { loading, setIsPopoverOpen } = useAppContext();
    const {
        chatboxRef,
        chatInputRef,
        userInputRef,
        done,
        setDone,
        chatPayload,
        setChatPayload,
        initChatPayload,
        setInitChatPayload,
        isSaveEnabled,
        setIsSaveEnabled,
        response,
        models,
        userInput,
        setUserInput,
        messages,
        setMessages,
        images,
        setImages,
        files,
        setFiles,
        chats,
        setChats,
        expand,
        setExpand,
        actions,
        setActions,
        logs,
        setLogs,
        tools,
        setTools,
        selectedImage,
        setSelectedImage,
        selectedDocument,
        setSelectedDocument,
        csvContent,
        setCsvContent,
        fetchChats,
        deleteChat,
        handleImageClick,
        sendChatPayload,
        handleRegenerateClick,
        fetchModels,
        resetChat,
        handleDocumentClick,
        submitQuestionStream,
        adjustHeight,
    } = useChatState();
    const searchParams = useSearchParams();
    const chatClient = new ChatClient();

    function resetOnCancel(clear: boolean = false) {
        sessionStorage.removeItem("system");
        sessionStorage.removeItem("provider");
        sessionStorage.removeItem("embedding");
        sessionStorage.removeItem("search_type");
        sessionStorage.removeItem("k");
        sessionStorage.removeItem("fetch_k");
        if (clear) {
            sessionStorage.removeItem("tools");
        } else {
            sessionStorage.setItem("tools", JSON.stringify(chatPayload.tools));
        }
    }

    const findChat = async (chatId: string) => {
        try {
            const res = await chatClient.find(chatId);
            setMessages(res.chat.messages);
            resetOnCancel(true);
            setIsPopoverOpen(false);
            setChatPayload((prev: ChatPayload) => ({
                ...prev,
                system: res.chat.system,
                history_id: chatId,
                retrieval: res.chat.retrieval,
                tools: res.chat.tools,
            }));
            setInitChatPayload((prev) => ({
                ...prev,
                system: res.chat.system,
                retrieval: res.chat.retrieval,
                tools: res.chat.tools,
            }));
            setLogs([]);
            renderConversation(res.chat.messages);
            setExpand(false);
            setSelectedDocument(null);
            setCsvContent(null);
            let updatedUrl = `/chat/${chatId}`;
            if (searchParams.toString()) {
                updatedUrl += `?${searchParams.toString()}`;
            }
            shallowUrl(updatedUrl);
        } catch (err) {
            alert(err); // Display error message from the exception
            console.error(err);
        }
    };

    const renderConversation = (messages: Message[]) => {
        let variants: { [key: string]: string } = {
            user: "primary",
            assistant: "secondary",
        };
        const filteredConvo = messages.filter((item) => item.role !== "system");

        return filteredConvo.map((conversationItem, i) => {
            const isLastMessage = i === filteredConvo.length - 1;
            const isLastAssistantMessage =
                isLastMessage && conversationItem.role === "assistant";
            const images = conversationItem.images || [];
            const sources = conversationItem.sources || [];
            const noContent = !selectedDocument && !csvContent;
            return (
                <div
                    className="pl-2 text-sm mb-3"
                    key={
                        variants[
                            conversationItem.role as keyof typeof variants
                        ] + i
                    }
                >
                    <h2 style={userMessageTitleStyle}>
                        {constructBubbleMessage(conversationItem.role)}
                    </h2>
                    {conversationItem.role === "assistant" &&
                    loading &&
                    isLastMessage ? (
                        <div className="flex items-center">
                            <img
                                className="w-5 h-5 animate-spin mt-2 ml-1"
                                src="https://www.svgrepo.com/show/491270/loading-spinner.svg"
                                alt="Loading icon"
                            />
                            <span className="ml-2">Processing...</span>
                        </div>
                    ) : null}
                    <ImageList images={images} />   
                    <SourceList
                        sources={sources}
                        noContent={noContent}
                        messageIndex={i}
                    />
                    {!expand &&
                        selectedDocument &&
                        selectedDocument.id === i && (
                            <div className="h-72">
                                <DocumentSection
                                    expand={true}
                                    document={selectedDocument.src}
                                />
                            </div>
                        )}
                    {conversationItem.role === "assistant" ? (
                        <>
                            {isLastAssistantMessage && logs.length > 0 && (
                                <ActionDisclosure />
                            )}
                            <MarkdownCard content={conversationItem.content} />
                        </>
                    ) : (
                        <p className="py-1 whitespace-pre-wrap">
                            {conversationItem.content}
                        </p>
                    )}

                    {conversationItem.role === "assistant" && !loading && (
                        <ResponseToolBar
                            index={i}
                            conversationItem={conversationItem}
                        />
                    )}
                </div>
            );
        });
    };

    useUpdateMessageOnResponesEffect(response, chatPayload, setMessages);
    useSubmitQuestionStreamEffect(userInput, messages, done, submitQuestionStream);
    useCheckIfSaveEnabledEffect(initChatPayload, chatPayload, setIsSaveEnabled);
    useFetchModelsEffect(models, fetchModels);
    usePrintActionsToLogsEffect(actions, setActions, setLogs, done);

    return (
        <ChatContext.Provider
            value={useMemo(() => {
                return {
                    chatboxRef,
                    chatInputRef,
                    userInputRef,
                    messages,
                    chats,
                    images,
                    chatPayload,
                    userInput,
                    selectedImage,
                    files,
                    actions,
                    logs,
                    tools,
                    done,
                    selectedDocument,
                    csvContent,
                    expand,
                    initChatPayload,
                    isSaveEnabled,
                    models,
                    fetchModels,
                    setCsvContent,
                    setFiles,
                    setActions,
                    setLogs,
                    setTools,
                    resetChat,
                    setChats,
                    setMessages,
                    setImages,
                    setChatPayload,
                    sendChatPayload,
                    deleteChat,
                    findChat,
                    renderConversation,
                    setUserInput,
                    setSelectedImage,
                    handleImageClick,
                    fetchChats,
                    adjustHeight,
                    setDone,
                    setSelectedDocument,
                    setExpand,
                    setInitChatPayload,
                    setIsSaveEnabled,
                    handleRegenerateClick,
                    handleDocumentClick,
                    resetOnCancel
                };
            }, [
                chats,
                done,
                expand,
                actions,
                logs,
                tools,
                userInput,
                chatboxRef,
                chatInputRef,
                userInputRef,
                messages,
                models,
                images,
                chatPayload,
                selectedImage,
                files,
                selectedDocument,
                csvContent,
                initChatPayload,
                isSaveEnabled,
            ])}
        >
            {children}
        </ChatContext.Provider>
    );
}

export function useChatContext(): any {
    return useContext(ChatContext);
}
