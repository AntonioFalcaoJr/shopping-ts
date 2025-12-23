import { IEmailGateway, EmailMessage } from '../../Application/Gateways/IEmailGateway';

export class EmailGateway implements IEmailGateway {
    async send(message: EmailMessage): Promise<void> {
        console.log('\n ===== EMAIL =====');
        console.log(`To: ${message.to}`);
        console.log(`Subject: ${message.subject}`);
        console.log('\nBody:');
        console.log(message.html || message.body);
        console.log('===================\n');
    }
}
