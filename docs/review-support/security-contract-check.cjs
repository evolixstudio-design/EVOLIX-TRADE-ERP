// Review-only, hermetic source contract checks. No database client is instantiated,
// no Nest application starts, no environment file loads, and no business data is used.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const backendRoot = path.resolve(__dirname, '../../backend-typescript');
const backendRequire = createRequire(path.join(backendRoot, 'package.json'));
const ts = backendRequire('typescript');
backendRequire('reflect-metadata');
require.extensions['.ts'] = (module, filename) => {
  const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2021,
      experimentalDecorators: true,
      emitDecoratorMetadata: true,
      esModuleInterop: true,
    },
  }).outputText;
  module._compile(output, filename);
};
const source = file => require(path.join(backendRoot, 'src', file));
const { Reflector } = backendRequire('@nestjs/core');
const { ValidationPipe } = backendRequire('@nestjs/common');
const context = (request, target, handler) => ({
  switchToHttp: () => ({ getRequest: () => request }),
  getClass: () => target,
  getHandler: () => handler,
});

(async () => {
  let observations = 0;
  const { AuthGuard } = source('common/guards/auth.guard.ts');
  const request = { headers: { authorization: 'Bearer stub-input', 'x-company-id': 'company-a', 'x-branch-id': 'branch-outside-company-a' } };
  const guard = new AuthGuard(new Reflector(), { verifyAsync: async () => ({ sub: 'review-user' }) }, {
    user: { findUnique: async () => ({ id: 'review-user', is_active: true, is_locked: true, roles: [{ company_id: 'company-a', branch_id: null, role: { name: 'STAFF', system_role: false, role_permissions: [] } }] }) },
  });
  assert.equal(await guard.canActivate(context(request)), true);
  assert.equal(request.user.branch_id, 'branch-outside-company-a');
  console.log('OBSERVED: AuthGuard accepts an arbitrary branch header for a company-wide membership.');
  observations++;
  console.log('OBSERVED: AuthGuard accepts an active user whose is_locked flag is true.');
  observations++;

  const { PosController } = source('pos/pos.controller.ts');
  let lookupArgs;
  await new PosController({ lookupItemByBarcode: (...args) => { lookupArgs = args; } }).lookupItemByBarcode({ user: { id: 'review-user', company_id: 'company-a' } }, 'review-code');
  assert.equal(lookupArgs[0], undefined);
  console.log('OBSERVED: PosController passes undefined companyId from the actual AuthGuard user shape.');
  observations++;

  const { PermissionGuard } = source('common/guards/permission.guard.ts');
  const { ClaimsController } = source('claims/claims.controller.ts');
  const permissionGuard = new PermissionGuard(new Reflector());
  assert.equal(permissionGuard.canActivate(context({ user: { role: 'STAFF', system_role: false, permissions: [] } }, ClaimsController, ClaimsController.prototype.createClaim)), true);
  assert.equal(permissionGuard.canActivate(context({ user: { role: 'STAFF', system_role: false, permissions: [] } }, ClaimsController, ClaimsController.prototype.updateClaimStatus)), true);
  console.log('OBSERVED: Claims create/update routes pass PermissionGuard with no permissions.');
  observations++;

  const { PurchaseService } = source('purchase/purchase.service.ts');
  let purchaseQuery;
  const foreignInvoice = { id: 'foreign-document', company_id: 'company-b' };
  const purchaseService = new PurchaseService({ purchaseInvoice: { findUnique: async query => { purchaseQuery = query; return foreignInvoice; } } }, {});
  assert.equal(await purchaseService.getPurchaseInvoiceById('foreign-document'), foreignInvoice);
  assert.deepEqual(purchaseQuery.where, { id: 'foreign-document' });
  console.log('OBSERVED: Purchase invoice detail returns the id-selected object with no caller scope check.');
  observations++;

  const pipe = new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true });
  const incomingBody = { status: 'POSTED', arbitrary: 'retained' };
  assert.deepEqual(await pipe.transform(incomingBody, { type: 'body', metatype: Object }), incomingBody);
  console.log('OBSERVED: ValidationPipe retains arbitrary properties when the route body metatype is Object.');
  observations++;

  console.log(`Review observations verified: ${observations}; failed: 0; skipped: 0; todo: 0. Database operations: 0.`);
})().catch(error => { console.error(error.message); process.exitCode = 1; });
