import Image from "next/image"
import Link from "next/link"
import { AiGeneratedCaption } from "@/components/landing/ai-generated-caption"
import { MAGAZIN_PATH, type MagazinArticle } from "@/lib/landing/magazin"

export function MagazinCardImage({ article }: { article: MagazinArticle }) {
  return (
    <figure className="magazin-card-figure">
      <Link href={`${MAGAZIN_PATH}/${article.slug}`} tabIndex={-1} aria-hidden>
        <Image
          src={article.image}
          alt=""
          width={1280}
          height={720}
          sizes="(min-width: 768px) 50vw, 100vw"
          className="magazin-card-image"
        />
      </Link>
      <AiGeneratedCaption force className="lp-ai-caption--inset lp-ai-caption--on-dark" />
    </figure>
  )
}
