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

import { useCallback } from 'react';
import IconButton from '@material-ui/core/IconButton';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { alertApiRef, useApi } from '@backstage/core-plugin-api';
import { useEntity } from '@backstage/plugin-catalog-react';

/**
 * Copies the current entity's reference to the clipboard.
 */
export function CopyEntityRefButton() {
  const { entity } = useEntity();
  const alertApi = useApi(alertApiRef);

  const copyRef = useCallback(async () => {
    const namespace = entity.metadata.namespace ?? 'default';
    const ref = `${entity.kind.toLocaleLowerCase('en-US')}/${namespace}:${
      entity.metadata.name
    }`;
    try {
      navigator.clipboard.writeText(ref);
      alertApi.post({
        message: `Copied ${ref}`,
        severity: 'success',
        display: 'transient',
      });
    } catch (e) {
      alertApi.post({ message: 'Could not copy entity ref', severity: 'error' });
    }
  }, [entity, alertApi]);

  return (
    <IconButton title="Copy entity ref" onClick={copyRef}>
      <FileCopyIcon />
    </IconButton>
  );
}
