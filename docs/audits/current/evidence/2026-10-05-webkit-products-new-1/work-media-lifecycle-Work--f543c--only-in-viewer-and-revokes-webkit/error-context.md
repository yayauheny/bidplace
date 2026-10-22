# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: work-media-lifecycle.spec.ts >> Work waits for CDN media, publishes revisions atomically, loads FULL only in viewer and revokes
- Location: e2e/work-media-lifecycle.spec.ts:17:5

# Error details

```
TimeoutError: page.waitForResponse: Timeout 10000ms exceeded while waiting for event "response"
```

# Test source

```ts
  26  |   const prisma = new PrismaClient({
  27  |     datasources: { db: { url: e2eDatabaseURL } },
  28  |   });
  29  |   const cdnRequests: string[] = [];
  30  |   await guest.route('https://media.example.test/**', async (route) => {
  31  |     const url = route.request().url();
  32  |     cdnRequests.push(url);
  33  |     const value = await guest.request.get(
  34  |       `${e2eApiBaseURL}/__media?key=${encodeURIComponent(new URL(url).pathname.slice(1))}`,
  35  |     );
  36  |     expect(value.status()).toBe(200);
  37  |     expect(value.headers()['content-type']).toContain('image/webp');
  38  |     await route.fulfill({ response: value });
  39  |   });
  40  |   try {
  41  |     const fault = async (enabled: boolean) => {
  42  |       const response = await guest.request.post(
  43  |         `${e2eApiBaseURL}/__media-fault?fail=${enabled}`,
  44  |       );
  45  |       expect(response.status()).toBe(200);
  46  |       expect(await response.json()).toEqual({ ok: true, failPublic: enabled });
  47  |     };
  48  |     const tick = async () => {
  49  |       expect(
  50  |         (await guest.request.post(`${e2eApiBaseURL}/__media-run`)).status(),
  51  |       ).toBe(200);
  52  |     };
  53  |     const suffix = `${test.info().project.name}-${Date.now()}`;
  54  |     const createdAuthor = await context.request.post(
  55  |       `${e2eApiBaseURL}/api/seller/profile`,
  56  |       {
  57  |         multipart: {
  58  |           slug: `work-${suffix}`,
  59  |           fullName: 'Work lifecycle author',
  60  |           country: 'BY',
  61  |           city: 'Minsk',
  62  |           discipline: 'Автор',
  63  |           shortDescription: 'Portfolio lifecycle',
  64  |           profilePhoto: {
  65  |             name: 'photo.png',
  66  |             mimeType: 'image/png',
  67  |             buffer: readFileSync('e2e/fixtures/profile-photo.png'),
  68  |           },
  69  |         },
  70  |       },
  71  |     );
  72  |     expect(createdAuthor.status()).toBe(201);
  73  |     const created = await createdAuthor.json();
  74  |     await context.request.post(
  75  |       `${e2eApiBaseURL}/api/author/application/advance`,
  76  |     );
  77  |     await context.request.post(
  78  |       `${e2eApiBaseURL}/api/author/application/advance`,
  79  |     );
  80  |     expect(
  81  |       (
  82  |         await context.request.post(
  83  |           `${e2eApiBaseURL}/api/author/application/submit`,
  84  |         )
  85  |       ).status(),
  86  |     ).toBe(201);
  87  |     expect(
  88  |       (
  89  |         await adminContext.request.patch(
  90  |           `${e2eApiBaseURL}/api/admin/seller-profiles/${created.sellerProfile.id}/status`,
  91  |           {
  92  |             data: {
  93  |               status: 'APPROVED',
  94  |               target: {
  95  |                 kind: 'revision',
  96  |                 id: created.editingRevision.id,
  97  |                 updatedAt: (
  98  |                   await (
  99  |                     await context.request.get(
  100 |                       `${e2eApiBaseURL}/api/seller/profile`,
  101 |                     )
  102 |                   ).json()
  103 |                 ).editingRevision.updatedAt,
  104 |               },
  105 |             },
  106 |           },
  107 |         )
  108 |       ).status(),
  109 |     ).toBe(200);
  110 |     await tick();
  111 |     await expect
  112 |       .poll(
  113 |         async () =>
  114 |           (
  115 |             await (
  116 |               await context.request.get(`${e2eApiBaseURL}/api/seller/profile`)
  117 |             ).json()
  118 |           ).sellerProfile.status,
  119 |       )
  120 |       .toBe('APPROVED');
  121 |     await page.goto('/products/new');
  122 |     await page.getByRole('button', { name: 'E2E art', exact: true }).click();
  123 |     await page
  124 |       .getByRole('textbox', { name: 'Название *', exact: true })
  125 |       .fill(`Lifecycle ${suffix}`);
> 126 |     const createWork = page.waitForResponse(
      |                             ^ TimeoutError: page.waitForResponse: Timeout 10000ms exceeded while waiting for event "response"
  127 |       (r) =>
  128 |         r.url().endsWith('/api/products') && r.request().method() === 'POST',
  129 |     );
  130 |     await page
  131 |       .getByRole('button', { name: 'Сохранить и продолжить', exact: true })
  132 |       .click();
  133 |     const work = (await (await createWork).json()).product;
  134 |     await expect(
  135 |       page.getByRole('button', { name: 'Добавить изображения', exact: true }),
  136 |     ).toBeVisible();
  137 |     let dropUploadResponse = true;
  138 |     await page.route('**/api/products/*/images', async (route) => {
  139 |       if (dropUploadResponse && route.request().method() === 'POST') {
  140 |         await route.fetch();
  141 |         dropUploadResponse = false;
  142 |         await route.abort('failed');
  143 |       } else await route.continue();
  144 |     });
  145 |     const chooser = page.waitForEvent('filechooser');
  146 |     await page
  147 |       .getByRole('button', { name: 'Добавить изображения', exact: true })
  148 |       .click();
  149 |     await (
  150 |       await chooser
  151 |     ).setFiles([
  152 |       'e2e/fixtures/profile-photo.png',
  153 |       'e2e/fixtures/profile-photo.png',
  154 |     ]);
  155 |     await page
  156 |       .getByRole('button', { name: 'Повторить загрузку', exact: true })
  157 |       .click();
  158 |     await expect(
  159 |       page.getByText('2/10 изображений', { exact: true }),
  160 |     ).toBeVisible();
  161 |     expect(
  162 |       await prisma.productImage.count({ where: { productId: work.id } }),
  163 |     ).toBe(2);
  164 |     await page
  165 |       .getByRole('button', { name: '4. Проверка', exact: true })
  166 |       .click();
  167 |     await page
  168 |       .getByRole('button', { name: 'Отправить на модерацию', exact: true })
  169 |       .click();
  170 |     await expect(
  171 |       page.getByText('Предмет отправлен на модерацию.', { exact: true }),
  172 |     ).toBeVisible();
  173 |     const approve = async () => {
  174 |       const detail = await (
  175 |         await context.request.get(
  176 |           `${e2eApiBaseURL}/api/seller/products/${work.id}`,
  177 |         )
  178 |       ).json();
  179 |       return adminContext.request.patch(
  180 |         `${e2eApiBaseURL}/api/admin/products/${work.id}/status`,
  181 |         {
  182 |           data: {
  183 |             status: 'APPROVED',
  184 |             target: {
  185 |               kind: 'revision',
  186 |               id: detail.editingRevision.id,
  187 |               updatedAt: detail.editingRevision.updatedAt,
  188 |             },
  189 |           },
  190 |         },
  191 |       );
  192 |     };
  193 |     await fault(true);
  194 |     expect((await approve()).status()).toBe(409);
  195 |     await page.goto(`/products/${work.id}`);
  196 |     await expect(
  197 |       page.getByText('Доставка медиа не выполнена. Повторите действие.', {
  198 |         exact: true,
  199 |       }),
  200 |     ).toBeVisible();
  201 |     expect(
  202 |       (
  203 |         await guest.request.get(`${e2eApiBaseURL}/api/works/${work.publicId}`)
  204 |       ).status(),
  205 |     ).toBe(404);
  206 |     await fault(false);
  207 |     expect((await approve()).status()).toBe(200);
  208 |     await expect
  209 |       .poll(async () =>
  210 |         (
  211 |           await guest.request.get(`${e2eApiBaseURL}/api/works/${work.publicId}`)
  212 |         ).status(),
  213 |       )
  214 |       .toBe(200);
  215 |     await guest.goto(`/product/${work.publicId}`);
  216 |     await expect(guest.getByTestId('work-gallery')).toBeVisible();
  217 |     await expect
  218 |       .poll(() => cdnRequests.some((url) => url.endsWith('/preview.webp')))
  219 |       .toBe(true);
  220 |     expect(cdnRequests.some((url) => url.endsWith('/full.webp'))).toBe(false);
  221 |     await guest.emulateMedia({ reducedMotion: 'reduce' });
  222 |     await guest
  223 |       .getByRole('button', { name: 'Открыть фото 1', exact: true })
  224 |       .click();
  225 |     await expect(
  226 |       guest.getByRole('dialog').getByRole('button', { name: 'Закрыть окно' }),
```