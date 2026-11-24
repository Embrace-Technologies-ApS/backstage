/*
 * Copyright 2026 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderInTestApp, TestApiProvider } from '@backstage/test-utils';
import { alertApiRef } from '@backstage/core-plugin-api';
import { EntityProvider } from '@backstage/plugin-catalog-react';
import { CopyEntityRefButton } from './CopyEntityRefButton';

const entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: { name: 'my-service', namespace: 'default' },
};

describe('CopyEntityRefButton', () => {
  const originalClipboard = Object.getOwnPropertyDescriptor(
    window.navigator,
    'clipboard',
  );

  afterEach(() => {
    if (originalClipboard) {
      Object.defineProperty(window.navigator, 'clipboard', originalClipboard);
    } else {
      delete (window.navigator as { clipboard?: unknown }).clipboard;
    }
  });

  it('renders the copy button', async () => {
    await renderInTestApp(
      <TestApiProvider apis={[[alertApiRef, { post: jest.fn() }]]}>
        <EntityProvider entity={entity}>
          <CopyEntityRefButton />
        </EntityProvider>
      </TestApiProvider>,
    );

    expect(screen.getByTitle('Copy entity ref')).toBeInTheDocument();
  });

  it('writes the entity ref to the clipboard and posts a success alert', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(window.navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    const alertApi = { post: jest.fn() };

    await renderInTestApp(
      <TestApiProvider apis={[[alertApiRef, alertApi]]}>
        <EntityProvider entity={entity}>
          <CopyEntityRefButton />
        </EntityProvider>
      </TestApiProvider>,
    );

    await userEvent.click(screen.getByTitle('Copy entity ref'));

    await waitFor(() => {
      expect(alertApi.post).toHaveBeenCalledWith({
        message: 'Copied component/default:my-service',
        severity: 'success',
        display: 'transient',
      });
    });
    expect(writeText).toHaveBeenCalledWith('component/default:my-service');
  });

  it('posts an error alert and no success alert when the clipboard write fails', async () => {
    const writeText = jest.fn().mockRejectedValue(new Error('denied'));
    Object.defineProperty(window.navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    const alertApi = { post: jest.fn() };

    await renderInTestApp(
      <TestApiProvider apis={[[alertApiRef, alertApi]]}>
        <EntityProvider entity={entity}>
          <CopyEntityRefButton />
        </EntityProvider>
      </TestApiProvider>,
    );

    await userEvent.click(screen.getByTitle('Copy entity ref'));

    await waitFor(() => {
      expect(alertApi.post).toHaveBeenCalledWith({
        message: 'Could not copy entity ref',
        severity: 'error',
      });
    });
    expect(alertApi.post).toHaveBeenCalledTimes(1);
  });
});
