export interface EmailMessage {
    to: string;
    subject: string;
    body: string;
    html?: string;
}

export interface IEmailGateway {
    send(message: EmailMessage): Promise<void>;
}
