
export enum Sender {
  User = 'user',
  Bot = 'bot',
}

export interface WebSource {
  uri: string;
  title: string;
}

export interface GroundingChunk {
  web: WebSource;
}

export interface Message {
  id: string;
  sender: Sender;
  text: string;
  sources?: GroundingChunk[];
  isLoading?: boolean;
}
