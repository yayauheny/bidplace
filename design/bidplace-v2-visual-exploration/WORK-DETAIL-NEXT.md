# Work Detail — product layers to preserve

**Not a screen. Not canon. Not Pen.**

This note exists so the next Work Detail visual pass does not confuse **reduced chrome** with **reduced product**.

Home / card explorations stay image-first and quiet. Work Detail still needs three content layers that Home does not have to show.

Fixture to use when that pass starts: `work_rich_live` (`w-1024` «Тихий берег», Полина Мирош, six gallery images, story, uniqueness, provenance, six process steps).

Do not start that pass from a single-image, story-less fixture.

---

## 1. Gallery controls

When a work has multiple images, the visitor must be able to move through them.

Keep:

- previous and next controls;
- discoverable, visually secondary to the artwork;
- optional small `1 / N` counter (fixture example: `1 / 6`);
- artwork remains the dominant object.

Do not:

- large decorative circular buttons on the image;
- a thumbnail strip in the hero (none by default);
- fake extra images behind a single work;
- letting the control become the visual event.

Keyboard and swipe stay in the later implementation contract. The visual pass must still show that prev/next exist.

This supersedes, for the next visual pass only, the older “one rightward arrow” sketch if it fights discoverable previous/next. Do not invent a lightbox in that pass.

---

## 2. Work story

The story is a core bidplace feature. It must not be compressed into the hero.

Reading sequence:

1. work hero (media + quiet identity + auction)
2. macro pause
3. `История работы`
4. text + supporting media
5. optional creation / process chapter

The story is a **chapter**, not a spec accordion and not a card.

Prefer:

- one strong supporting image, not a grid of leftovers;
- readable text measure;
- asymmetrical editorial placement;
- supporting details disclosed progressively (uniqueness, provenance, process — not all as peer cards in the first story viewport).

Do not:

- dump story under the title in the hero to “save a scroll”;
- turn story into tabs/chips as the default reading;
- omit story because Home explorations were quiet.

---

## 3. Creator — two appearances, different jobs

### Hero (quiet)

Answer: **who made this?**

Normal form:

`Полина Мирош ↗`

Simple linked identity. Same grammar as Home B2 / work_feature.

Do not use in the hero:

- creator card;
- badge;
- avatar chip;
- follower / social / stat block.

### Later chapter (richer)

Answer: **why should I care about this creator?**

Sequence:

portrait  
→ creator name  
→ short practice / context  
→ open creator profile

Do not give both appearances the same visual weight. The hero link is a caption. The later chapter is a person.

This is separate from «Ещё от {name}» (more works). More works do not replace the creator chapter.

---

## What this does *not* change

- Home and work-card explorations stay as they are.
- Discovery cards still do not show price, deadline, or bid count.
- Auction on Work Detail remains required and secondary to the artwork.
- Do not build Work Detail until that pass is explicitly started.
