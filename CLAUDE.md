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
