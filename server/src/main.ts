import path from "path";
import express,
  {Express, NextFunction, Request, Response} from "express";
import {serverInfo} from "./ServerInfo";
import * as IMAP from "./IMAP";
import * as SMTP from "./SMTP";
import * as Contacts from "./contacts";
import { IContact } from "./contacts";

const app: Express = express();

app.use(express.json());

app.use("/",
  express.static(path.join(__dirname, "../../client/dist"))
);

app.use(function(inRequest: Request, inResponse: Response,
inNext: NextFunction) {
  inResponse.header("Access-Control-Allow-Origin", "*");
  inResponse.header("Access-Control-Allow-Methods",
  "GET,POST,DELETE,OPTIONS"
);
inResponse.header("Access-Control-Allow-Header",
"Origin,X-Requested-With,Content-Type,Accept"
);
inNext();
});

app.get("/mailboxes",
async (inRequest: Request, inResponse: Response) => {
    console.log("GET /mailboxes (1)");
  try {
    const imapWorker: IMAP.Worker = new IMAP.Worker(serverInfo);
    const mailboxes: IMAP.IMailbox[] = await imapWorker.listMailboxes();
      console.log("GET /mailboxes (1): Ok", mailboxes);
    inResponse.json(mailboxes);
  } catch (inError) {
          console.log("GET /mailboxes (1): Error", inError);
    inResponse.send("error");
    }
  }
);

app.get("/mailboxes/:mailbox",
async (inRequest: Request, inResponse: Response) =>{
  try {
    const imapWorker: IMAP.Worker = new IMAP.Worker(serverInfo);
    const messages: IMAP.IMessage[] = await imapWorker.listMessages({
      mailbox: inRequest.params.mailbox
    });
          console.log("GET /mailboxes (2): Ok", messages);
    inResponse.json(messages);
  } catch (inError) {
    inResponse.send("error");
    }
  }
);

app.get("/messages/:mailbox/:id",
async (inRequest: Request, inResponse: Response) =>{
    console.log("GET /messages (3)", inRequest.params.mailbox, inRequest.params.id);
  try {
    const imapWorker: IMAP.Worker = new IMAP.Worker(serverInfo);
    const messageBody: string = await imapWorker.getMessageBody({
      mailbox : inRequest.params.mailbox,
      id : parseInt(inRequest.params.id, 10)
    });
    console.log("GET /messages (3): Ok", messageBody);
    inResponse.send(messageBody);
  } catch (inError) {
    console.log("GROSS");
    inResponse.send("error");
    }
  }
);

app.delete("/messages/:mailbox/:id",
async (inRequest: Request, inResponse: Response) => {
  try {
    const imapWorker: IMAP.Worker = new IMAP.Worker(serverInfo);
    await imapWorker.deleteMessage({
      mailbox : inRequest.params.mailbox,
      id : parseInt(inRequest.params.id, 10)
    });
    inResponse.send("ok");
  } catch (inError) {
    inResponse.send("error");
    }
  }
);

app.post("/messages",
async (inRequest: Request, inResponse: Response) =>{
  try {
    const smtpWorker: SMTP.Worker = new SMTP.Worker(serverInfo);
    await smtpWorker.sendMessage(inRequest.body);
    inResponse.send("ok");
  } catch (inError) {
    inResponse.send("error");
    }
  }
);

app.get("/contacts",
async (inRequest: Request, inResponse: Response) => {
  try {
    const contactsWorker: Contacts.Worker = new Contacts.Worker();
    const contacts: IContact[] = await contactsWorker.listContacts();
    inResponse.json(contacts);
  } catch (inError) {
    inResponse.send("error");
    }
  }
);

app.post("/contacts",
async (inRequest: Request, inResponse: Response)=>{
  try {
    const contactsWorker: Contacts.Worker = new Contacts.Worker();
    const contact: IContact = await contactsWorker.addContact
    (inRequest.body);
    inResponse.json(contact);
  } catch (inError) {
    inResponse.send("error");
    }
  }
);

app.delete("/contacts/:id",
async (inRequest: Request, inResponse: Response) => {
  try {
    const contactsWorker: Contacts.Worker = new Contacts.Worker();
    await contactsWorker.deleteContact(inRequest.params.id);
    inResponse.send("ok");
  } catch (inError) {
    inResponse.send("error");
    }
  }
);

app.listen(80, () => {
  console.log("MailBag server open for requests");
});
