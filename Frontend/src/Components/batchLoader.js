// Simple global batch loader for images
// - Starts allowing batch 0 (first 12 images)
// - Observes DOM for elements with class `batch-sentinel` and data-batch attribute
// - When a sentinel intersects, allows up to that batch + 1

const subscribers = new Set();
let allowedBatch = 0; // inclusive: batches 0..allowedBatch are allowed

const notify = () => {
  subscribers.forEach(fn => {
    try { fn(allowedBatch); } catch (e) { /* ignore */ }
  });
};

export const isAllowed = (batchIndex) => {
  if (typeof batchIndex !== 'number') return true;
  return batchIndex <= allowedBatch;
};

export const allowUpTo = (batchIndex) => {
  if (typeof batchIndex !== 'number') return;
  if (batchIndex > allowedBatch) {
    allowedBatch = batchIndex;
    notify();
  }
};

export const getAllowedBatch = () => allowedBatch;

export const subscribe = (fn) => {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
};

// IntersectionObserver to watch sentinels and expand allowed batches
if (typeof window !== 'undefined' && typeof IntersectionObserver !== 'undefined') {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting || entry.intersectionRatio > 0) {
        const batch = Number(entry.target.dataset.batch);
        if (!Number.isNaN(batch)) {
          // allow up to next batch (batch + 1)
          allowUpTo(batch + 1);
        }
      }
    });
  }, { rootMargin: '600px' });

  const observeAll = () => {
    document.querySelectorAll('.batch-sentinel[data-batch]').forEach(el => io.observe(el));
  };

  // observe existing
  try { observeAll(); } catch (e) { /* ignore on SSR */ }

  // watch for new sentinels being added to DOM
  const mo = new MutationObserver(mutations => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node && node.querySelectorAll) {
          node.querySelectorAll && node.querySelectorAll('.batch-sentinel[data-batch]').forEach(el => io.observe(el));
        }
        // node itself could be sentinel
        if (node instanceof Element && node.matches && node.matches('.batch-sentinel[data-batch]')) {
          io.observe(node);
        }
      }
    }
  });
  try { mo.observe(document.body, { childList: true, subtree: true }); } catch (e) { /* ignore if body not available yet */ }
}

// initially allow the first batch
allowUpTo(0);

export default { isAllowed, allowUpTo, getAllowedBatch, subscribe };