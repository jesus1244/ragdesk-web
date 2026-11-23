import { Route } from '@angular/router';

import { BOT_TABS } from './features/bots/bot-detail';
import { routes } from './app.routes';

function find(list: Route[], path: string): Route | undefined {
  for (const route of list) {
    if (route.path === path) {
      return route;
    }
    const nested = find(route.children ?? [], path);
    if (nested) {
      return nested;
    }
  }
  return undefined;
}

describe('routes', () => {
  it('has a page for every tab of an assistant', () => {
    // Regression: the tabs were declared in the detail page but missing from the router.
    const detail = find(routes, 'bots/:id');
    const children = (detail?.children ?? []).map((r) => r.path);
    for (const tab of BOT_TABS) {
      expect(children).toContain(tab.path);
    }
  });

  it('keeps the signed-in pages behind the auth guard', () => {
    const shell = routes.find(
      (r) => r.canActivate?.length && r.children?.some((c) => c.path === 'bots'),
    );
    expect(shell).toBeDefined();
  });

  it('every page route has a title', () => {
    const missing: string[] = [];
    const visit = (list: Route[]) => {
      for (const r of list) {
        if (r.loadComponent && !r.title && r.path !== 'bots/:id' && !r.children) {
          missing.push(r.path ?? '');
        }
        visit(r.children ?? []);
      }
    };
    visit(routes);
    expect(missing).toEqual([]);
  });
});
