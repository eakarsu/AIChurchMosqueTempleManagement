'use strict';
const { AsyncLocalStorage } = require('node:async_hooks');
const context = new AsyncLocalStorage();
function nativeAIContext(req, res, next) {
  if (!/(?:\/ai(?:\/|-)|\/report-workspace\/run)/.test(req.path) || req.method !== 'POST') return next();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 90000);
  const close = () => { clearTimeout(timer); if (!res.writableEnded) controller.abort(); };
  res.once('close', close); res.once('finish', () => clearTimeout(timer));
  context.run({ signal: controller.signal,fields:req.body||{} }, next);
}
const currentSignal = () => context.getStore()?.signal;
const currentFields=()=>context.getStore()?.fields||{};
module.exports = { nativeAIContext, currentSignal, currentFields };
