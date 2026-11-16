import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { MagazinArticlePage } from "@/components/landing/magazin-article-page"
import { LANDING_IMAGES } from "@/lib/landing/content"
import {
  MAGAZIN_PATH,
  buildMagazinArticleJsonLd,
  getAllMagazinSlugs,
  getMagazinArticle,
} from "@/lib/landing/magazin"

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://braceled-led-armband.com"

type Props = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return getAllMagazinSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const article = getMagazinArticle(slug)
  if (!article) {
    return { title: "Artikel nicht gefunden | BraceLED" }
  }

  const path = `${MAGAZIN_PATH}/${article.slug}`

  return {
    title: `${article.title} | BraceLED Magazin`,
    description: article.description,
    alternates: { canonical: path },
    robots: { index: true, follow: true },
    openGraph: {
      url: `${siteUrl}${path}`,
      siteName: "BraceLED",
      locale: "de_DE",
      type: "article",
      title: article.title,
      description: article.description,
      publishedTime: article.datePublished,
      modifiedTime: article.dateModified,
      images: [{ url: LANDING_IMAGES.front, alt: article.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.description,
    },
  }
}

export default async function MagazinArticleRoute({ params }: Props) {
  const { slug } = await params
  const article = getMagazinArticle(slug)
  if (!article) notFound()

  const jsonLd = buildMagazinArticleJsonLd(siteUrl, article)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MagazinArticlePage article={article} />
    </>
  )
}
