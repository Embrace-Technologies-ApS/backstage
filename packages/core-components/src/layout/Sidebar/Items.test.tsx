/*
 * Copyright 2020 The Backstage Authors
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

import {
  mockApis,
  TestApiProvider,
  renderInTestApp,
} from '@backstage/test-utils';
import { createEvent, fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HomeIcon from '@material-ui/icons/Home';
import CreateComponentIcon from '@material-ui/icons/AddCircleOutline';
import { Sidebar } from './Bar';
import { SidebarItem, SidebarSearchField, SidebarExpandButton } from './Items';
import { SidebarSubmenu } from './SidebarSubmenu';
import { SidebarSubmenuItem } from './SidebarSubmenuItem';
import { renderHook } from '@testing-library/react';
import { makeStyles } from '@material-ui/core/styles';
import { analyticsApiRef } from '@backstage/core-plugin-api';

const useStyles = makeStyles({
  spotlight: {
    backgroundColor: '#2b2a2a',
  },
});

const handleSidebarItemClick = jest.fn();
const analyticsApiMock = mockApis.analytics();

async function renderSidebar() {
  const { result } = renderHook(() => useStyles());

  await renderInTestApp(
    <TestApiProvider apis={[[analyticsApiRef, analyticsApiMock]]}>
      <Sidebar>
        <SidebarSearchField onSearch={() => {}} to="/search" />
        <SidebarItem text="Home" icon={HomeIcon} to="./" />
        <SidebarItem
          icon={CreateComponentIcon}
          onClick={handleSidebarItemClick}
          text="Create..."
          className={result.current.spotlight}
        />
        <SidebarItem
          icon={CreateComponentIcon}
          to="/docs"
          onClick={handleSidebarItemClick}
          text="Docs"
          className={result.current.spotlight}
        />
        <SidebarItem
          icon={CreateComponentIcon}
          to="/explore"
          onClick={handleSidebarItemClick}
          text="Explore"
          className={result.current.spotlight}
          noTrack
        />
        <SidebarExpandButton />
      </Sidebar>
    </TestApiProvider>,
  );
  await userEvent.hover(screen.getByTestId('sidebar-root'));
}

describe('Items', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await renderSidebar();
  });

  describe('SidebarItem', () => {
    it('should render a link when `to` prop provided', async () => {
      expect(
        await screen.findByRole('link', { name: /home/i }),
      ).toBeInTheDocument();
    });

    it('should render a button when `to` prop is not provided', async () => {
      expect(
        await screen.findByRole('button', { name: /create/i }),
      ).toBeInTheDocument();
    });

    it('should render a button with custom style', async () => {
      expect(
        await screen.findByRole('button', { name: /create/i }),
      ).toHaveStyle(`background-color: rgba(0, 0, 0, 0)`); // transparent
    });

    it('should send button clicks to analytics', async () => {
      await userEvent.click(
        await screen.findByRole('button', { name: /create/i }),
      );
      expect(handleSidebarItemClick).toHaveBeenCalledTimes(1);
      expect(analyticsApiMock.captureEvent).toHaveBeenCalledWith({
        action: 'click',
        subject: 'Create...',
        context: { routeRef: 'unknown', pluginId: 'root', extension: 'App' },
        attributes: { to: '/' },
      });
    });

    it('should send link clicks to analytics', async () => {
      await userEvent.click(await screen.findByRole('link', { name: /docs/i }));
      expect(handleSidebarItemClick).toHaveBeenCalledTimes(1);
      expect(analyticsApiMock.captureEvent).toHaveBeenCalledWith({
        action: 'click',
        subject: 'Docs',
        context: { routeRef: 'unknown', pluginId: 'root', extension: 'App' },
        attributes: { to: '/docs' },
      });
    });

    it('should not send clicks to analytics when tracking is disabled', async () => {
      await userEvent.click(
        await screen.findByRole('link', { name: /explore/i }),
      );
      expect(analyticsApiMock.captureEvent).not.toHaveBeenCalled();
    });
  });

  describe('SidebarSearchField', () => {
    it('should be defaultPrevented when enter is pressed', async () => {
      const searchEvent = createEvent.keyDown(
        await screen.findByPlaceholderText('Search'),
        { key: 'Enter', code: 'Enter', charCode: 13 },
      );
      fireEvent(await screen.findByPlaceholderText('Search'), searchEvent);
      expect(searchEvent.defaultPrevented).toBeTruthy();
    });
  });
});

describe('SidebarItem isActive', () => {
  it('should highlight links and submenu parents by route match unless isActive is given', async () => {
    await renderInTestApp(
      <Sidebar>
        <SidebarItem
          icon={HomeIcon}
          to="/catalog?filters[kind]=Component"
          text="Components"
        />
        <SidebarItem
          icon={HomeIcon}
          to="/catalog?filters[kind]=API"
          text="APIs"
          isActive={false}
        />
        <SidebarItem icon={HomeIcon} to="/docs" text="Docs" isActive />
        <SidebarItem icon={HomeIcon} to="/explore" text="Explore" />
        <SidebarItem icon={HomeIcon} text="Catalog Menu">
          <SidebarSubmenu title="Catalog">
            <SidebarSubmenuItem title="Catalog" to="/catalog" />
          </SidebarSubmenu>
        </SidebarItem>
        <SidebarItem icon={HomeIcon} text="Catalog Menu Off" isActive={false}>
          <SidebarSubmenu title="Catalog">
            <SidebarSubmenuItem title="Catalog" to="/catalog" />
          </SidebarSubmenu>
        </SidebarItem>
        <SidebarItem icon={HomeIcon} text="Templates Menu">
          <SidebarSubmenu title="Templates">
            <SidebarSubmenuItem title="Templates" to="/templates" />
          </SidebarSubmenu>
        </SidebarItem>
        <SidebarItem icon={HomeIcon} text="Docs Menu" isActive>
          <SidebarSubmenu title="Docs">
            <SidebarSubmenuItem title="Docs" to="/docs/intro" />
          </SidebarSubmenu>
        </SidebarItem>
      </Sidebar>,
      { routeEntries: ['/catalog?filters[kind]=Component'] },
    );

    const selectedClass = 'BackstageSidebarItem-selected';
    expect(
      screen.getByRole('link', { name: 'Components' }).className,
    ).toContain(selectedClass);
    expect(screen.getByRole('link', { name: 'APIs' }).className).not.toContain(
      selectedClass,
    );
    expect(screen.getByRole('link', { name: 'Docs' }).className).toContain(
      selectedClass,
    );
    expect(
      screen.getByRole('link', { name: 'Explore' }).className,
    ).not.toContain(selectedClass);
    expect(
      screen.getByRole('button', { name: 'Catalog Menu' }).className,
    ).toContain(selectedClass);
    expect(
      screen.getByRole('button', { name: 'Catalog Menu Off' }).className,
    ).not.toContain(selectedClass);
    expect(
      screen.getByRole('button', { name: 'Templates Menu' }).className,
    ).not.toContain(selectedClass);
    expect(
      screen.getByRole('button', { name: 'Docs Menu' }).className,
    ).toContain(selectedClass);
  });
});
