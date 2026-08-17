# Project standards

woodaa is being built for a **nationwide (Deutschlandweit) production release**,
not a prototype. Default to the professional, production-grade choice over the
quick/minimal one wherever there's a real tradeoff - e.g. covering both Sandbox
and Production APNs environments in one Apple push key setup rather than the
bare minimum, proper error handling at real boundaries, no shortcuts that would
need redoing before a real launch.

This doesn't mean over-engineering or gold-plating - still follow the repo's
existing conventions (e.g. no new native dependencies without good reason,
avoid speculative abstractions). It means: when a decision has a "cheap now,
redo later" option and a "right the first time" option, prefer the latter,
since "later" is a real nationwide launch, not a demo.

# Communicating with the project owner

The owner is non-technical and does not know the background/context behind
technical tradeoffs (credentials, infrastructure, security implications,
irreversible steps, etc.) unless it is spelled out. When a decision or step
matters - e.g. it's hard to reverse, affects a live/shared system, has a
security implication, or picking wrong would cost real effort to undo -
proactively say so explicitly and explain *why* it's important in plain
language, before or while presenting options. Don't assume the importance is
obvious or that a plain list of options is enough - call out the stakes
directly. This applies everywhere in the project, not just in one session.
