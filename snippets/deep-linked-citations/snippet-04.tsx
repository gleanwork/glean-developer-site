type Snippet = { text: string; pageNumber?: number }

async function loadDocumentContent(docId: string): Promise<string> {
  const resp = await fetch("/rest/api/v1/getdocuments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      documentSpecs: [{ id: docId }],
      includeFields: ["DOCUMENT_CONTENT"],
    }),
  })
  const data = await resp.json()
  const doc = Object.values(data.documents)[0] as any
  return (doc?.content?.fullTextList || []).join("\n\n")
}

function findSurroundingText(
  fullText: string,
  snippetText: string,
  windowChars = 200,
): { preceding: string; cited: string; following: string } {
  const idx = fullText.indexOf(snippetText)
  if (idx === -1) {
    return { preceding: "", cited: snippetText, following: "" }
  }
  const start = Math.max(0, idx - windowChars)
  const end = Math.min(fullText.length, idx + snippetText.length + windowChars)
  return {
    preceding: fullText.slice(start, idx),
    cited: fullText.slice(idx, idx + snippetText.length),
    following: fullText.slice(idx + snippetText.length, end),
  }
}

function CitationPopover({ citation }: { citation: any }) {
  const [docContent, setDocContent] = useState<string | null>(null)

  useEffect(() => {
    if (citation.sourceDocument?.id) {
      loadDocumentContent(citation.sourceDocument.id).then(setDocContent)
    }
  }, [citation.sourceDocument?.id])

  const ranges = citation.referenceRanges ?? []

  if (!ranges.length) {
    // Fallback: document-level citation only
    return <div>{citation.sourceDocument?.title}</div>
  }

  return (
    <div className="citation-popover">
      <div className="citation-header">
        <strong>{citation.sourceDocument?.title}</strong>
        {ranges[0]?.snippets?.[0]?.pageNumber != null && (
          <span> · Page {ranges[0].snippets[0].pageNumber}</span>
        )}
      </div>
      <div className="snippet-context">
        {ranges.flatMap((range, idx) =>
          (range.snippets || []).map((s, j) => {
            if (!docContent) {
              return <div key={`${idx}-${j}`}>{s.text}</div>
            }
            const { preceding, cited, following } = findSurroundingText(
              docContent,
              s.text,
            )
            // Fallback if snippet text couldn't be matched in document
            if (!preceding && !following) {
              return <div key={`${idx}-${j}`}>{s.text}</div>
            }
            return (
              <p key={`${idx}-${j}`}>
                {preceding && <span className="muted">...{preceding}</span>}
                <mark>{cited}</mark>
                {following && <span className="muted">{following}...</span>}
              </p>
            )
          }),
        )}
      </div>
    </div>
  )
}
