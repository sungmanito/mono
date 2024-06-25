import type { Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';

export async function login(page: Page) {
  await page.getByLabel('Username').fill(process.env.TEST_USER || '');
  await page.getByLabel('Password').fill(process.env.TEST_PW || '');
  await page.getByText('Submit').click();
}

export async function navigateAndLoginTo(url: string, page: Page) {
  await page.goto('/');
  await page.goto(url);
  await login(page);
}

// Content shamelessly stolen from https://github.com/microsoft/playwright/issues/10667#issuecomment-998397241
export async function dragAndDropFile(
  page: Page,
  selector: string,
  filePath: string,
  fileType: string,
) {
  const buffer = await readFile(filePath).then((b) => b.toString('base64'));

  // Create the DataTransfer and File
  const dataTransfer = await page.evaluateHandle(
    async (data) => {
      const dt = new DataTransfer();
      // Convert the buffer to a hex array
      const blob = await fetch(data.buffer).then((r) => r.blob());
      const file = new File([blob], data.fileName, {
        type: data.fileType,
      });
      dt.items.add(file);
      return dt;
    },
    {
      buffer: `data:application/octet-stream;base64,${buffer}`,
      fileName: basename(filePath),
      fileType,
    },
  );

  // Now dispatch
  await page.dispatchEvent(selector, 'drop', { dataTransfer });
}
