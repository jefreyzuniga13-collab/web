import { useEffect, useMemo, useState } from "react"
import {
  ExternalLink,
  ImageOff,
  Megaphone,
  Play,
} from "lucide-react"

import type { MetaAdReferralDto } from "@/Interfaces/Chat/ChatInterfaces"
import "@/Styles/Chat/MetaAdReferralCard.css"

type MetaAdReferralCardProps = {
  referral: MetaAdReferralDto
}

const normalizeValue = (
  value?: string | null
): string => {
  return String(value ?? "").trim()
}

const getSafeUrl = (
  value?: string | null
): string | null => {
  const cleanValue = normalizeValue(value)

  if (!cleanValue) return null

  try {
    const parsedUrl = new URL(cleanValue)

    if (
      parsedUrl.protocol !== "http:" &&
      parsedUrl.protocol !== "https:"
    ) {
      return null
    }

    return parsedUrl.toString()
  } catch {
    return null
  }
}

/**
 * Determina si la URL apunta directamente a un archivo reproducible.
 *
 * Las URL como facebook.com/reel/... son páginas, no archivos de video,
 * por lo que deben abrirse externamente usando su miniatura.
 */
const isDirectVideoUrl = (
  value: string | null
): boolean => {
  if (!value) return false

  return /\.(mp4|webm|ogg|mov)(?:$|[?#])/i.test(
    value
  )
}

export const MetaAdReferralCard = ({
  referral,
}: MetaAdReferralCardProps) => {
  const [mediaError, setMediaError] =
    useState(false)

  const headline = normalizeValue(
    referral.headline
  )

  const body = normalizeValue(
    referral.body
  )

  const sourceType = normalizeValue(
    referral.sourceType
  )

  const mediaType = normalizeValue(
    referral.mediaType
  ).toLowerCase()

  const imageUrl = getSafeUrl(
    referral.imageUrl
  )

  const videoUrl = getSafeUrl(
    referral.videoUrl
  )

  const thumbnailUrl = getSafeUrl(
    referral.thumbnailUrl
  )

  const sourceUrl = getSafeUrl(
    referral.sourceUrl
  )

  const isVideo =
    mediaType === "video" ||
    Boolean(videoUrl)

  const hasDirectVideo =
    isVideo &&
    isDirectVideoUrl(videoUrl)

  /**
   * Para reels o videos de Facebook se muestra thumbnail_url.
   * video_url normalmente apunta a una página de Facebook.
   */
  const previewUrl = useMemo(() => {
    if (isVideo) {
      return (
        thumbnailUrl ||
        imageUrl
      )
    }

    return (
      imageUrl ||
      thumbnailUrl
    )
  }, [
    imageUrl,
    isVideo,
    thumbnailUrl,
  ])

  const destinationUrl = useMemo(() => {
    if (isVideo) {
      return (
        videoUrl ||
        sourceUrl
      )
    }

    return sourceUrl
  }, [
    isVideo,
    sourceUrl,
    videoUrl,
  ])

  useEffect(() => {
    setMediaError(false)
  }, [
    previewUrl,
    videoUrl,
  ])

  const hasContent = Boolean(
    headline ||
      body ||
      previewUrl ||
      hasDirectVideo ||
      destinationUrl ||
      referral.sourceId ||
      sourceType
  )

  if (!hasContent) return null

  return (
    <article className="meta-ad-referral">
      <header className="meta-ad-referral__header">
        <span
          className="meta-ad-referral__icon"
          aria-hidden="true"
        >
          <Megaphone size={15} />
        </span>

        <span className="meta-ad-referral__label">
          Anuncio
        </span>

        {sourceType && (
          <span className="meta-ad-referral__source-type">
            {sourceType}
          </span>
        )}
      </header>

      {hasDirectVideo &&
        videoUrl &&
        !mediaError && (
          <div className="meta-ad-referral__media">
            <video
              className="meta-ad-referral__video"
              controls
              preload="metadata"
              poster={
                thumbnailUrl ??
                undefined
              }
              onError={() =>
                setMediaError(true)
              }
            >
              <source src={videoUrl} />
              Tu navegador no puede reproducir este video.
            </video>
          </div>
        )}

      {!hasDirectVideo &&
        previewUrl &&
        !mediaError && (
          <div className="meta-ad-referral__media">
            <img
              className="meta-ad-referral__image"
              src={previewUrl}
              alt={
                headline ||
                "Vista previa del anuncio"
              }
              loading="lazy"
              onError={() =>
                setMediaError(true)
              }
            />

            {isVideo &&
              destinationUrl && (
                <a
                  href={destinationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="meta-ad-referral__play"
                  aria-label="Abrir video del anuncio"
                  title="Abrir video"
                >
                  <span className="meta-ad-referral__play-icon">
                    <Play
                      size={22}
                      fill="currentColor"
                    />
                  </span>
                </a>
              )}
          </div>
        )}

      {(previewUrl ||
        videoUrl) &&
        mediaError && (
          <div className="meta-ad-referral__media-error">
            <ImageOff size={20} />
            <span>
              Vista previa no disponible
            </span>
          </div>
        )}

      {(headline || body) && (
        <div className="meta-ad-referral__content">
          {headline && (
            <h4 className="meta-ad-referral__title">
              {headline}
            </h4>
          )}

          {body && (
            <p className="meta-ad-referral__body">
              {body}
            </p>
          )}
        </div>
      )}

      {destinationUrl && (
        <footer className="meta-ad-referral__footer">
          <a
            href={destinationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="meta-ad-referral__link"
          >
            <span>
              {isVideo
                ? "Ver video"
                : "Ver anuncio"}
            </span>

            <ExternalLink size={14} />
          </a>
        </footer>
      )}
    </article>
  )
}

export default MetaAdReferralCard