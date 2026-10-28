export function PersonalCallBanner() {
  return (
    <aside
      className="rounded-xl border border-[#2dd4bf]/40 bg-gradient-to-r from-[#7c3aed]/15 via-[#14b8a6]/12 to-[#2dd4bf]/20 px-4 py-3 text-center shadow-sm"
      role="note"
    >
      <p className="text-sm font-semibold tracking-tight text-[#5b21b6] sm:text-base">
        Lieber persönlich? Ruf unser Team an:{" "}
        <a
          href="tel:08009475864"
          className="underline decoration-[#14b8a6]/70 underline-offset-2 hover:text-[#0f766e]"
        >
          0800 WIRKUNG!
        </a>
      </p>
    </aside>
  )
}
