
import {default as axios} from 'axios';
import { workspace } from 'vscode';
import { ITranslate, ITranslateOptions } from 'comment-translate-manager';
import {ChatGPTUnofficialProxyAPI} from 'chatgpt';

const PREFIXCONFIG = 'chatgptTranslate';

enum UseMode {
    openAI = 'openAI',
    unofficialProxy = 'unofficialProxy'
}

const langMaps: Map<string, string> = new Map([
    ['zh-CN', 'ZH'],
    ['zh-TW', 'ZH'],
]);
// 你好吗

function convertLang(src: string) {
    if (langMaps.has(src)) {
        return langMaps.get(src);
    }
    return src.toLocaleUpperCase();
}

export function getConfig<T>(key: string): T | undefined {
    let configuration = workspace.getConfiguration(PREFIXCONFIG);
    return configuration.get<T>(key);
}



interface ChatGPTTranslateOption {
    authKey?: string;
    accessToken?: string;
    useMode?: UseMode;
    reverseProxyUrl?: string;
    conversationId?: string;
    parentMessageId?: string;
}

export class ChatGPTTranslate implements ITranslate {
    get maxLen(): number {
        return 3000;
    }

    private _defaultOption: ChatGPTTranslateOption;
    constructor() {
        this._defaultOption = this.createOption();
        workspace.onDidChangeConfiguration(async eventNames => {
            if (eventNames.affectsConfiguration(PREFIXCONFIG)) {
                this._defaultOption = this.createOption();
            }
        });
    }

    createOption() {
        const defaultOption:ChatGPTTranslateOption = {
            authKey: getConfig<string>('authKey'),
            accessToken: getConfig<string>('accessToken'),
            useMode: getConfig<UseMode>('useMode'),
            reverseProxyUrl: getConfig<string>('reverseProxyUrl'),
            conversationId: getConfig<string>('conversationId'),
            parentMessageId: getConfig<string>('parentMessageId'),

        };
        return defaultOption;
    }

    async translateFromChatGPTUnofficialProxy(content: string) {
        if (!this._defaultOption.accessToken) {
            throw new Error('Please check the configuration of accessToken!');
        }
        if (!this._defaultOption.reverseProxyUrl) {
            throw new Error('Please check the configuration of reverseProxyUrl!');
        }

        if (!!this._defaultOption.conversationId !== !!this._defaultOption.parentMessageId) {
            throw new Error(
              'ConversationId and parentMessageId must both be set or both be undefined.'
            );
          }

        const api = new ChatGPTUnofficialProxyAPI({
            accessToken: this._defaultOption.accessToken,
            apiReverseProxyUrl: this._defaultOption.reverseProxyUrl,
          });

        let userPrompt = `translate from en to zh-Hans, return content only`;
        userPrompt = `${userPrompt}:\n"${content}"`;
        const res = await api.sendMessage(userPrompt, {conversationId: this._defaultOption.conversationId, parentMessageId: this._defaultOption.parentMessageId});
        
        let targetTxt = res.text;

        if (targetTxt.startsWith('"') || targetTxt.startsWith("「")) {
            targetTxt = targetTxt.slice(1);
        }
        if (targetTxt.endsWith('"') || targetTxt.endsWith("」")) {
            targetTxt = targetTxt.slice(0, -1);
        }
        
        return targetTxt;
    }

    async translate(content: string, options: ITranslateOptions) {
        if (this._defaultOption.useMode === UseMode.openAI) {
            return this.translateFromOpenAI(content, options);
        } else if (this._defaultOption.useMode === UseMode.unofficialProxy) {
            return this.translateFromChatGPTUnofficialProxy(content);
        } else {
            throw new Error('Please check the configuration of useMode!');
        }
    }

    // TODO: 使用 chatgpt 模块的 ChatGPTAPI 类重构？
    async translateFromOpenAI(content: string, { to = 'auto' }: ITranslateOptions) {

        const url = `https://api.openai.com/v1/chat/completions`;

        if(!this._defaultOption.authKey) {
            throw new Error('Please check the configuration of authKey!');
        }
        let systemPrompt = "You are a translation engine that can only translate text and cannot interpret it.";
        let userPrompt = `translate from en to zh-Hans`;
        userPrompt = `${userPrompt}:\n\n"${content}" =>`;
        const body = {
            model: 'gpt-3.5-turbo',
            temperature: 0,
            max_tokens: 1000,
            top_p: 1,
            frequency_penalty: 1,
            presence_penalty: 1,
            messages:[
                {
                    role: "system",
                    content: systemPrompt,
                },
                { role: "user", content: userPrompt },
            ]
        };
        
        const headers = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this._defaultOption.authKey}`,
        };

        let res = await axios.post(url,body,{
            headers
        });
        const { choices } = res.data;
        let targetTxt = choices[0].message.content.trim();
        if (targetTxt.startsWith('"') || targetTxt.startsWith("「")) {
            targetTxt = targetTxt.slice(1);
        }
        if (targetTxt.endsWith('"') || targetTxt.endsWith("」")) {
            targetTxt = targetTxt.slice(0, -1);
        }
        return targetTxt.split("\n");
    }


    link(content: string, { to = 'auto' }: ITranslateOptions) {
        let str = `https://api.openai.com/v1/chat/completions/${convertLang(to)}/${encodeURIComponent(content)}`;
        if (this._defaultOption.useMode === UseMode.unofficialProxy) {
            str = this._defaultOption.reverseProxyUrl as string;
        }
        return `[ChatGPT](${str})`;
    }

    isSupported(src: string) {
        return true;
    }
}





