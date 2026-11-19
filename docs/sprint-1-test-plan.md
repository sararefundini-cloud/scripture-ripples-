# Scripture Ripples — Sprint 1 Test Plan

Status: Test plan drafted; application changes and browser verification pending.

## SR-001 Preserve original experience
- Capture baseline of the live Full Pond, demo, frog, graph, reading plan, Build Your Pond, references and navigation.
- Make all code changes on `scripture-ripples-backlog-test`, never `main`.
- Verify every baseline feature after each code change.

## SR-002 Original lexicon
- Locate the authoritative motif/lexicon data source in the application.
- Compare every demo stone's label and ID to that source.
- Report missing, renamed, duplicate or invented entries; do not add unsupported motifs.
- Confirm every original motif can be selected in the demo.

## SR-003 Connection visibility
- With no stones in the pond, show no connection lines.
- With only one endpoint in the pond, show no line for that edge.
- With both endpoints in the pond, show the line only if the relationship exists in approved graph data.
- Unrelated stones must never be connected merely because they are nearby.
- Removing either endpoint must remove its line.

## SR-004 Spatial proximity — decision required
- Decide whether visual adjacency filters otherwise valid relationships. Never create a biblical relationship solely from proximity.

## Release gate
- Test on narrow mobile and desktop viewports.
- Verify graph, verse click-throughs, reading plan, Build Your Pond, and all tabs.
- Do not merge to main or publish until tests pass and the product owner approves.
