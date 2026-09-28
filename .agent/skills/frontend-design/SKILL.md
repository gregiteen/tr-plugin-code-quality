---
name: frontend-design
description: Guidance for distinctive, intentional visual design when building new UI or reshaping an existing one. Helps with aesthetic direction, typography, and making choices that don't read as templated defaults.
license: Complete terms in LICENSE.txt
---

# Frontend Design

Approach this as the design lead at a small studio known for giving every client a visual identity that could not be mistaken for anyone else's. This client has already rejected proposals that felt templated, and is paying for a distinctive point of view: make deliberate, opinionated choices about palette, typography, and layout that are specific to this brief, and take one real aesthetic risk you can justify.

## Ground it in the subject

If the brief does not pin down what the product or subject is, pin it yourself before designing: name one concrete subject, its audience, and the page's single job, and state your choice. If there's any information in your memory about the human's preferences, context about what they're building, or designs you've made before – use that as a hint. The subject's own world, its materials, instruments, artifacts, and vernacular, is where distinctive choices come from. Build with the brief's real content and subject matter throughout.

## DESIGN.md (Google Standard)

Every design needs a `DESIGN.md`. It's the first thing you do. You must rigidly follow the open-source Google Standard specification for `DESIGN.md` to serve as a visual identity "source of truth" and constraint file for all downstream AI agents:
1. **YAML Front Matter**: The file MUST begin with a machine-readable YAML block containing your chosen design tokens (e.g., exact hex codes, typography scales, spacing units, border-radius settings).
2. **Markdown Prose**: The remainder of the file must be human-readable Markdown that explains the "why" behind the design decisions. Justify the layout strategy, motion approach, and the intent behind the tokens. This strictly prevents agents from hallucinating or defaulting to generic styles.

## Mobile-First & Touch-Friendly Architecture

**You are strictly mandated to output mobile-first CSS.** 
- All base CSS rules must target mobile devices (e.g. single-column layouts, fluid typography).
- Use `min-width` media queries (e.g., `@media (min-width: 768px)`) exclusively to scale layouts up for tablets and desktops. Never use `max-width` for core layout structure.
- **Touch Targets:** All interactive elements (buttons, links, nav items) must have a minimum tap target of `44px` by `44px`. Use padding to artificially inflate tap areas without destroying visual density. No exceptions.

## Design principles

For web designs, the hero is a thesis. Open with the most characteristic thing in the subject's world, in whatever form makes sense for it: a headline, an image, an animation, a live demo, an interactive moment. Be deliberate with your choice: a big number with a small label, supporting stats, and a gradient accent is the template answer, only use if that's truly the best option.

Typography carries the personality of the page. Pair the display and body faces deliberately, not the same families you would reach for on any other project, and set a clear type scale with intentional weights, widths, and spacing. Make the type treatment itself a memorable part of the design, not a neutral delivery vehicle for the content.

Structure is information. Structural devices, numbering, eyebrows, dividers, labels, should encode something true about the content, not decorate it. Many generic designs use numbered markers (01 / 02 / 03), but that's only appropriate if the content actually is a sequence - like a real process or a typed timeline where order carries information the reader needs. Question if choices like numbered markers actually make sense before incorporating them.

Leverage motion deliberately. Think about where and if animation can serve the subject: a page-load sequence, a scroll-triggered reveal, hover micro-interactions, ambient atmosphere. An orchestrated moment usually lands harder than scattered effects; choose what the direction calls for. However, sometimes less is more, and extra animation contributes to the feeling that the design is AI-generated.

Match complexity to the vision. Maximalist directions need elaborate execution; minimal directions need precision in spacing, type, and detail. Elegance is executing the chosen vision well.

Consider written content carefully. Often a design brief may not contain real content, and it's up to you to come up with copy. Copy can make a design feel as templated as the design itself. See the below section on writing for more guidance.

## Process: brainstorm, explore, plan, critique, build, critique again

For calibration: AI-generated design right now clusters around three looks: (1) a warm cream background (near #F4F1EA) with a high-contrast serif display and a terracotta accent; (2) a near-black background with a single bright acid-green or vermilion accent; (3) a broadsheet-style layout with hairline rules, zero border-radius, and dense newspaper-like columns. All three are legitimate for some briefs, but if you find yourself reaching for one reflexively, stop and ask whether the brief actually calls for it or whether you are pattern-matching to familiar AI output. Do this for typography choices too: Inter, DM Sans, Space Grotesk + a serif display are fine fonts but have become AI-design shorthand. The goal is not to avoid them absolutely, but to choose them only when they are genuinely the best fit for the subject.

Before writing any code, brainstorm a few directions, pick one, plan the full page in detail, then critique the plan specifically for templated choices, and fix any you find. After building, review the implementation: does it feel like it was designed for this exact brief, or could the same page work for any subject with a find-and-replace?

## Writing

Copy should sound highly professional, austere, and strictly business-focused. Before writing, define the voice in three words (e.g., "dry, precise, authoritative") and stick to them. The voice should be appropriate for a high-end technical agency. 

**STRICT PROHIBITIONS:**
- **NO EMOJIS:** You must absolutely never use emojis in any generated UI, layout, or copy.
- **NO BUZZWORDS:** Avoid filler phrases common in cheap marketing copy ("Dive into…", "Unleash your…", "Elevate your…", "Supercharge").
- **NO "SOVEREIGN":** Do not use the word "sovereign" under any circumstances. It is considered trite and unprofessional by the client.

Every heading should do real work: convey a specific technical claim, set a serious tone, or orient the reader. If a heading could apply to any competitor, rewrite it. Prefer concrete, austere language over abstract hype: instead of "Innovative solutions for modern teams", strictly state the architectural realities of what the system does. Keep body copy short and direct; cut any sentence that restates the previous one in different words.
