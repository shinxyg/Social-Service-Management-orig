import { useState } from "react"
import { Sparkles, X, Send } from "lucide-react"
import { API_BASE } from "../../config/api"

export function AIChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<{ from: "user" | "ai"; text: string }[]>([
    { from: "ai", text: "Hi! I'm your assistant. Ask me about cases, requirements, or program details." },
  ])
  const [input, setInput] = useState("")

  const [isLoading, setIsLoading] = useState(false)

    const handleSend = async () => {
      if (!input.trim() || isLoading) return

      const userMessage = input
      setMessages((m) => [...m, { from: "user", text: userMessage }])
      setInput("")
      setIsLoading(true)

      try {
        const response = await fetch(`${API_BASE}/api/chat/message`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: userMessage,
            history: messages, // ipinapadala yung nakaraang usapan para may context
          }),
        })

        if (!response.ok) throw new Error("Failed to get response")

        const data = await response.json()
        setMessages((m) => [...m, { from: "ai", text: data.reply }])
      } catch (err) {
        console.error("Chat error:", err)
        setMessages((m) => [
          ...m,
          { from: "ai", text: "Paumanhin, may problema sa koneksyon. Pakisubukan ulit." },
        ])
      } finally {
        setIsLoading(false)
      }
    }

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-6 w-80 max-h-112 bg-card border border-border rounded-2xl shadow-large flex flex-col z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-primary/5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">AI Assistant</span>
            </div>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`text-sm px-3 py-2 rounded-xl max-w-[85%] ${
                    m.from === "user"
                      ? "bg-primary text-primary-foreground ml-auto"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {m.text}
                </div>
              ))}
              {isLoading && (
                <div className="text-sm px-3 py-2 rounded-xl max-w-[85%] bg-muted text-muted-foreground flex items-center gap-1.5">
                  <span className="animate-pulse">●</span>
                  <span className="animate-pulse" style={{ animationDelay: "0.2s" }}>●</span>
                  <span className="animate-pulse" style={{ animationDelay: "0.4s" }}>●</span>
                </div>
              )}
            </div>
            <div className="p-2 border-t border-border flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type a message..."
                disabled={isLoading}
                className="flex-1 h-9 px-3 rounded-lg bg-muted text-sm outline-none placeholder:text-muted-foreground disabled:opacity-60"
              />
              <button
                onClick={handleSend}
                disabled={isLoading}
                className="h-9 w-9 shrink-0 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-2xl bg-primary text-primary-foreground shadow-large flex items-center justify-center hover:opacity-90 transition-opacity z-50"
        aria-label="Open AI assistant"
      >
        <Sparkles className="h-6 w-6" />
      </button>
    </>
  )
}