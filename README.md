# brAIn-store

Curated registry of [brAIn](https://github.com/tibzejoker/brAIn) nodes.

The brAIn dashboard fetches `registry.json` from this repo (raw GitHub URL)
and shows every listed node in its **Store** tab. One-click install
clones the parent repo as a sibling of the brAIn checkout and refreshes
pnpm's workspace; the framework's type-registry picks the new types up
on the next scan.

## Adding a node

1. Fork this repo.
2. Add an entry under `repos` if your node lives in a new repository.
3. Add an entry under `nodes` pointing at it (`repo` + `subpath`).
4. Open a PR — review verifies that the package builds, that `config.json`
   is valid, and that the node is licensed permissively.

## Schema

`registry.json` validates against [`registry.schema.json`](./registry.schema.json).

```json
{
  "version": 1,
  "repos": {
    "brAIn-perception": {
      "url": "https://github.com/tibzejoker/brAIn-perception",
      "clone": "https://github.com/tibzejoker/brAIn-perception.git",
      "default_branch": "main"
    }
  },
  "nodes": [
    {
      "name": "voice",
      "package_name": "@brain/node-voice",
      "repo": "brAIn-perception",
      "subpath": "nodes/voice",
      "version": "0.1.0",
      "tags": ["service", "voice"],
      "description": "Local STT + speaker diarization.",
      "has_ui": true,
      "needs_python": true,
      "needs_ollama": false
    }
  ]
}
```

## License

[MIT](./LICENSE) — Copyright © 2026 Thibaut Léaux.
