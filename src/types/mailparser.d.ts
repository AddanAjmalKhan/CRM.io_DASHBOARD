declare module 'mailparser' {
  export interface ParsedMail {
    messageId?: string
    inReplyTo?: string
    references?: string | string[]
    from?:    { value: Array<{ name?: string; address?: string }> }
    to?:      { value: Array<{ name?: string; address?: string }> }
    replyTo?: { value: Array<{ name?: string; address?: string }> }
    subject?: string
    date?: Date
    text?: string
    html?: string | false
  }
  export function simpleParser(source: Buffer | string): Promise<ParsedMail>
}
