// Let `node --test handbook/tools/test/` work without package.json changes.
// Individual *.test.mjs files also work with Node's normal test discovery.
Promise.all([import('./markdown.test.mjs'), import('./site.test.mjs'), import('./accessibility.test.mjs'), import('./reading.test.mjs'), import('./online.test.mjs'), import('./components.test.mjs'), import('./snapshots.test.mjs'), import('./design.test.mjs'), import('./launch.test.mjs'), import('./search.test.mjs'), import('./interaction.test.mjs'), import('./quests.test.mjs'), import('./quest-browser.test.mjs'), import('./assistant.test.mjs'), import('./assistant-worker.test.mjs'), import('./planner.test.mjs'), import('./map-paths.test.mjs'), import('./map-location.test.mjs'), import('./map-pin-runtime.test.mjs'), import('./guides.test.mjs')]).catch(error => {
  console.error(error);
  process.exitCode = 1;
});
