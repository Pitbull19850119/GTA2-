# Trystero (vendored)

Serverless WebRTC rooms for co-op (D20): players find each other through public
WebTorrent trackers, then talk directly peer to peer. MIT licence (`LICENSE`).

- `@trystero-p2p/core` 0.25.4 (`core/`, the package's `dist/*.mjs`), tarball SHA-256
  `d0b156fbe560770d8c7dcb4cb8a51c2e90c2a5cdb35c800ed5c5998c5e4a7c44`
- `@trystero-p2p/torrent` 0.25.4 (`torrent.mjs`, the package's `dist/index.mjs`), tarball SHA-256
  `5aa48a1f785b22e320aaf4357ed1b1a8e9ffa7d5f2ecdba4a232799e2fd5b2fe`

Changes from the published files: the `@trystero-p2p/core` import in `torrent.mjs`
points at `./core/index.mjs`, and the `sourceMappingURL` comments are removed (the
maps are not shipped).
