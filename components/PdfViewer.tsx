"use client"

import { Button, buttonVariants } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ChevronLeft, ChevronRight, Home, Maximize2, Minimize2, Moon, Search, Sun, SunDim } from "lucide-react"
import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"

// ── Sub-components defined outside to avoid hydration mismatches ──

type PageNavProps = {
  pageNum: number
  totalPages: number
  pdfDoc: any
  pageInput: string
  setPageInput: (v: string) => void
  goTo: (n: number) => void
  onCommit: () => void
}

function PageNav({ pageNum, totalPages, pdfDoc, pageInput, setPageInput, goTo, onCommit }: PageNavProps) {
  return (
    <div className="flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger
          render={
            <Button variant="ghost" size="icon" onClick={() => goTo(pageNum - 1)} disabled={pageNum <= 1 || !pdfDoc} />
          }>
          <ChevronLeft className="size-4" />
        </TooltipTrigger>
        <TooltipContent>Previous page</TooltipContent>
      </Tooltip>

      <div className="flex items-center gap-1.5 px-1 text-sm text-muted-foreground tabular-nums">
        <input
          className="w-10 text-center bg-muted rounded-md border border-border py-0.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          value={pageInput}
          onChange={e => setPageInput(e.target.value)}
          onBlur={onCommit}
          onKeyDown={e => {
            if (e.key === "Enter") onCommit()
          }}
          disabled={!pdfDoc}
        />
        <span>/ {totalPages || "—"}</span>
      </div>

      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              onClick={() => goTo(pageNum + 1)}
              disabled={pageNum >= totalPages || !pdfDoc}
            />
          }>
          <ChevronRight className="size-4" />
        </TooltipTrigger>
        <TooltipContent>Next page</TooltipContent>
      </Tooltip>
    </div>
  )
}

type ColorMode = "light" | "dark" | "shade"
const nextMode: Record<ColorMode, ColorMode> = { light: "dark", dark: "shade", shade: "light" }
const modeLabel: Record<ColorMode, string> = { light: "Light", dark: "Dark", shade: "Shade" }
const ModeIcon = ({ mode }: { mode: ColorMode }) => {
  if (mode === "dark") return <Moon className="size-4" />
  if (mode === "shade") return <SunDim className="size-4" />
  return <Sun className="size-4" />
}

type DarkToggleProps = { mode: ColorMode; onCycle: () => void }

function DarkToggle({ mode, onCycle }: DarkToggleProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={<Button variant="outline" size="icon" onClick={onCycle} aria-label="Cycle colour mode" />}>
        <ModeIcon mode={mode} />
      </TooltipTrigger>
      <TooltipContent>
        {modeLabel[mode]} — click for {modeLabel[nextMode[mode]]}
      </TooltipContent>
    </Tooltip>
  )
}

type FocusToggleProps = { focused: boolean; onToggle: () => void }

function FocusToggle({ focused, onToggle }: FocusToggleProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button variant={focused ? "secondary" : "outline"} size="icon" onClick={onToggle} aria-label="Focus mode" />
        }>
        {focused ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
      </TooltipTrigger>
      <TooltipContent>{focused ? "Exit focus mode" : "Focus mode"}</TooltipContent>
    </Tooltip>
  )
}

type ZoomResetProps = { onReset: () => void }

function ZoomReset({ onReset }: ZoomResetProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={<Button variant="outline" size="icon" onClick={onReset} aria-label="Reset zoom" />}>
        <Search className="size-4" />
      </TooltipTrigger>
      <TooltipContent>Reset zoom</TooltipContent>
    </Tooltip>
  )
}

// ── Main component ──

type Props = {
  bookId: number
  title: string
  author: string | null
  initialPage: number
  pdfUrl: string
}

export default function PdfViewer({ bookId, title, author, initialPage, pdfUrl }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [pdfDoc, setPdfDoc] = useState<any>(null)
  const [pageNum, setPageNum] = useState(initialPage)
  const [totalPages, setTotalPages] = useState(0)
  const [colorMode, setColorMode] = useState<ColorMode>(
    () => (localStorage.getItem("colorMode") as ColorMode) ?? "shade"
  )
  const cycleMode = useCallback(
    () =>
      setColorMode(m => {
        const next = nextMode[m]
        localStorage.setItem("colorMode", next)
        return next
      }),
    []
  )
  const [focused, setFocused] = useState(false)
  const [cssFallback, setCssFallback] = useState(false) // true on iOS where native FS fails
  const [loading, setLoading] = useState(true)
  const [zoomScale, setZoomScale] = useState(1)
  const zoomRef = useRef(1) // tracks live zoom without stale closure issues
  const [pageInput, setPageInput] = useState(String(initialPage))
  const renderTaskRef = useRef<any>(null)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scrollFocusRef = useRef<{ xPct: number; yPct: number } | null>(null)

  useEffect(() => {
    const script = document.createElement("script")
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"
    script.onload = () => {
      const pdfjsLib = (window as any).pdfjsLib
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"
      pdfjsLib.getDocument(pdfUrl).promise.then((doc: any) => {
        setPdfDoc(doc)
        setTotalPages(doc.numPages)
        fetch(`/api/books/${bookId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ totalPages: doc.numPages }),
        })
      })
    }
    document.head.appendChild(script)
    return () => {
      document.head.removeChild(script)
    }
  }, [pdfUrl, bookId])

  const renderPage = useCallback(
    async (num: number, doc: any) => {
      if (!doc || !canvasRef.current) return
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel()
        try {
          await renderTaskRef.current.promise
        } catch {}
        renderTaskRef.current = null
      }
      setLoading(true)
      const page = await doc.getPage(num)
      const natural = page.getViewport({ scale: 1 })
      const isMobile = Math.min(window.screen.width, window.screen.height) < 768
      const reservedH = focused ? 0 : isMobile ? 2 + 64 + 24 : 58 + 40
      const availW = focused ? window.innerWidth : window.innerWidth * (isMobile ? 0.92 : 0.88)
      const availH = window.innerHeight - reservedH
      const dpr = window.devicePixelRatio || 1
      const baseScale = Math.min(availW / natural.width, availH / natural.height)
      const cssScale = baseScale * zoomRef.current
      const scale = cssScale * dpr
      const viewport = page.getViewport({ scale })
      const canvas = canvasRef.current
      // Physical pixels (sharp on retina)
      canvas.width = viewport.width
      canvas.height = viewport.height
      // Logical CSS size (correct layout size)
      canvas.style.width = `${viewport.width / dpr}px`
      canvas.style.height = `${viewport.height / dpr}px`
      const ctx = canvas.getContext("2d")!
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      const task = page.render({ canvasContext: ctx, viewport })
      renderTaskRef.current = task
      try {
        await task.promise
      } catch (e: any) {
        if (e?.name !== "RenderingCancelledException") console.error(e)
      }
      // Scroll so the pinch focal point stays centred after re-render.
      // Wait one animation frame so the browser has reflowed the new canvas size first.
      const focus = scrollFocusRef.current
      if (focus && mainRef.current && canvasRef.current) {
        const el = mainRef.current
        const c = canvasRef.current
        await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
        // canvas sits at top-left of a plain overflow-auto container (no flex centering when zoomed)
        // so offsetLeft == horizontal margin-auto value, offsetTop == container padding-top
        el.scrollLeft = Math.max(0, c.offsetLeft + c.clientWidth * focus.xPct - el.clientWidth / 2)
        el.scrollTop = Math.max(0, c.offsetTop + c.clientHeight * focus.yPct - el.clientHeight / 2)
        scrollFocusRef.current = null
      }
      setLoading(false)
    },
    [focused, zoomScale]
  )

  // Keep zoomRef in sync so renderPage can read the latest value without stale closure
  useEffect(() => { zoomRef.current = zoomScale }, [zoomScale])

  useEffect(() => {
    if (pdfDoc) renderPage(pageNum, pdfDoc)
  }, [pdfDoc, pageNum, renderPage])

  useEffect(() => {
    const handler = () => {
      if (pdfDoc) renderPage(pageNum, pdfDoc)
    }
    window.addEventListener("resize", handler)
    return () => window.removeEventListener("resize", handler)
  }, [pdfDoc, pageNum, renderPage])

  // Sync when user exits native fullscreen via Escape
  useEffect(() => {
    const handler = () => {
      if (!document.fullscreenElement) setFocused(false)
    }
    document.addEventListener("fullscreenchange", handler)
    document.addEventListener("webkitfullscreenchange", handler)
    return () => {
      document.removeEventListener("fullscreenchange", handler)
      document.removeEventListener("webkitfullscreenchange", handler)
    }
  }, [])

  const toggleFocus = useCallback(async () => {
    const next = !focused
    setFocused(next)
    if (next) {
      try {
        const el = document.documentElement as any
        await (el.requestFullscreen ?? el.webkitRequestFullscreen)?.call(el)
        setCssFallback(false) // native fullscreen worked
      } catch {
        // iOS / unsupported — hide bars as CSS fallback
        setCssFallback(true)
      }
    } else {
      setCssFallback(false)
      try {
        const exit = (document as any).exitFullscreen ?? (document as any).webkitExitFullscreen
        await exit?.call(document)
      } catch {}
    }
  }, [focused])

  const savePage = useCallback(
    (page: number) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = setTimeout(() => {
        fetch(`/api/books/${bookId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lastPage: page }),
        })
      }, 1000)
    },
    [bookId]
  )

  const goTo = useCallback(
    (n: number) => {
      if (n < 1 || n > totalPages) return
      setPageNum(n)
      setPageInput(String(n))
      savePage(n)
    },
    [totalPages, savePage]
  )

  const handlePageInputCommit = useCallback(() => {
    const n = parseInt(pageInput, 10)
    if (!isNaN(n)) goTo(n)
    else setPageInput(String(pageNum))
  }, [pageInput, pageNum, goTo])

  const resetZoom = useCallback(() => {
    zoomRef.current = 1
    scrollFocusRef.current = null
    setZoomScale(1)
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      if (e.key === "ArrowRight" || e.key === "ArrowDown") goTo(pageNum + 1)
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") goTo(pageNum - 1)
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [pageNum, goTo])

  // Swipe to navigate + pinch to zoom
  const mainRef = useRef<HTMLElement>(null)
  useEffect(() => {
    const el = mainRef.current
    if (!el) return

    let startX = 0
    let startDist = 0
    let pinchStartZoom = 1
    let isPinching = false
    let lastTap = 0
    let pinchOriginX = 50 // % relative to canvas
    let pinchOriginY = 50

    const getDistance = (touches: TouchList) =>
      Math.hypot(
        touches[0].clientX - touches[1].clientX,
        touches[0].clientY - touches[1].clientY
      )

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        startX = e.touches[0].clientX
        isPinching = false
        // Double-tap to reset zoom
        const now = Date.now()
        if (now - lastTap < 300) {
          zoomRef.current = 1
          setZoomScale(1)
          scrollFocusRef.current = null
        }
        lastTap = now
      } else if (e.touches.length === 2) {
        isPinching = true
        startDist = getDistance(e.touches)
        pinchStartZoom = zoomRef.current
        // Capture pinch midpoint as % of canvas for transform-origin
        if (canvasRef.current) {
          const rect = canvasRef.current.getBoundingClientRect()
          const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2
          const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2
          pinchOriginX = ((midX - rect.left) / rect.width) * 100
          pinchOriginY = ((midY - rect.top) / rect.height) * 100
        }
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length < 2) return
      e.preventDefault()
      if (!canvasRef.current) return
      const dist = getDistance(e.touches)
      const ratio = dist / startDist
      const newZoom = Math.max(0.5, Math.min(4, pinchStartZoom * ratio))
      // Live CSS feedback zooming into the pinch point — no re-render until finger up
      canvasRef.current.style.transformOrigin = `${pinchOriginX}% ${pinchOriginY}%`
      canvasRef.current.style.transform = `scale(${newZoom / zoomRef.current})`
    }

    const onTouchEnd = (e: TouchEvent) => {
      if (isPinching && e.touches.length < 2) {
        isPinching = false
        if (canvasRef.current) {
          const match = canvasRef.current.style.transform.match(/scale\(([^)]+)\)/)
          canvasRef.current.style.transform = ""
          canvasRef.current.style.transformOrigin = ""
          if (match) {
            const relScale = parseFloat(match[1])
            const newZoom = Math.max(0.5, Math.min(4, zoomRef.current * relScale))
            // Store focal point so renderPage can scroll to it after re-render
            scrollFocusRef.current = { xPct: pinchOriginX / 100, yPct: pinchOriginY / 100 }
            zoomRef.current = newZoom
            setZoomScale(newZoom)
          }
        }
      } else if (!isPinching && zoomRef.current <= 1 && e.changedTouches.length > 0) {
        const dx = e.changedTouches[0].clientX - startX
        if (Math.abs(dx) >= 50) {
          if (dx < 0) goTo(pageNum + 1)
          else goTo(pageNum - 1)
        }
      }
    }

    el.addEventListener("touchstart", onTouchStart, { passive: true })
    el.addEventListener("touchmove", onTouchMove, { passive: false })
    el.addEventListener("touchend", onTouchEnd, { passive: true })
    return () => {
      el.removeEventListener("touchstart", onTouchStart)
      el.removeEventListener("touchmove", onTouchMove)
      el.removeEventListener("touchend", onTouchEnd)
    }
  }, [pageNum, goTo])

  // Block iOS webkit gesture events (browser-level pinch zoom on the page)
  useEffect(() => {
    const prevent = (e: Event) => e.preventDefault()
    document.addEventListener("gesturestart", prevent)
    document.addEventListener("gesturechange", prevent)
    return () => {
      document.removeEventListener("gesturestart", prevent)
      document.removeEventListener("gesturechange", prevent)
    }
  }, [])

  const progress = totalPages ? Math.round((pageNum / totalPages) * 100) : 0

  const navProps: PageNavProps = {
    pageNum,
    totalPages,
    pdfDoc,
    pageInput,
    setPageInput,
    goTo,
    onCommit: handlePageInputCommit,
  }

  return (
    <TooltipProvider delay={400}>
      <div className="h-svh bg-background flex flex-col overflow-hidden">
        {/* Desktop top bar */}
        <header
          className={`shrink-0 border-b bg-card/80 backdrop-blur-sm shadow-sm ${cssFallback ? "hidden" : "hidden md:block"}`}>
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate leading-none">{title}</p>
              {author && <p className="text-xs text-muted-foreground truncate mt-0.5">{author}</p>}
            </div>
            <PageNav {...navProps} />
            <Separator orientation="vertical" className="h-5" />
            <DarkToggle mode={colorMode} onCycle={cycleMode} />
            <FocusToggle focused={focused} onToggle={toggleFocus} />
          </div>
          <div className="h-0.5 bg-muted">
            <div className="h-full bg-primary transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
          </div>
        </header>

        {/* PDF canvas */}
        <main
          ref={mainRef}
          className={`flex-1 ${zoomScale > 1 ? "overflow-auto" : "flex flex-col items-center justify-center overflow-hidden"} ${focused ? "p-0" : "py-4 px-4"}`}>
          {!pdfDoc && (
            <div
              className="rounded-xl shadow-2xl bg-muted animate-pulse flex items-center justify-center text-muted-foreground text-sm"
              style={{
                width: "min(88vw, 520px)",
                aspectRatio: "3 / 4",
              }}>
              Loading PDF…
            </div>
          )}
          <canvas
            ref={canvasRef}
            className={`transition-[filter] duration-200 ${zoomScale <= 1 ? "max-w-full" : "block mx-auto"} ${!pdfDoc ? "hidden" : ""} ${focused ? "" : "rounded-xl shadow-2xl"}`}
            style={{
              filter:
                colorMode === "dark"
                  ? "invert(1) hue-rotate(180deg)"
                  : colorMode === "shade"
                    ? "invert(0.76) hue-rotate(180deg)"
                    : "none",
            }}
          />
        </main>

        {/* Floating exit button — shown only in iOS CSS fallback mode */}
        {cssFallback && (
          <button
            onClick={toggleFocus}
            className="fixed top-4 right-4 z-50 bg-card/90 backdrop-blur-sm border border-border rounded-full p-2.5 shadow-lg"
            aria-label="Exit focus mode">
            <Minimize2 className="size-5" />
          </button>
        )}

        {/* Mobile bottom bar */}
        <div className={`shrink-0 border-t bg-card/80 backdrop-blur-sm ${cssFallback ? "hidden" : "md:hidden"}`}>
          {/* Progress bar sits on top of the bar */}
          <div className="h-0.5 bg-muted">
            <div className="h-full bg-primary transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
          </div>
          <div className="h-16 px-6 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Link href="/" className={buttonVariants({ variant: "outline", size: "icon" })}>
                <Home className="size-4" />
              </Link>
              <DarkToggle mode={colorMode} onCycle={cycleMode} />
              <FocusToggle focused={focused} onToggle={toggleFocus} />
              {zoomScale > 1 && <ZoomReset onReset={resetZoom} />}
            </div>
            <PageNav {...navProps} />
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
