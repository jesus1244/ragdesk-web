import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { Icon } from '../../shared/icon';

@Component({
  selector: 'app-auth-layout',
  imports: [RouterOutlet, Icon],
  host: { class: 'grid min-h-dvh lg:grid-cols-2' },
  template: `
    <aside
      class="relative hidden overflow-hidden bg-teal-950 p-12 text-white lg:flex lg:flex-col lg:justify-between"
    >
      <div
        class="absolute -top-40 -right-40 size-[28rem] rounded-full bg-teal-600/40 blur-3xl"
      ></div>
      <div class="absolute -bottom-32 -left-24 size-96 rounded-full bg-cyan-600/30 blur-3xl"></div>
      <p class="relative flex items-center gap-2 text-lg font-semibold">
        <span class="flex size-8 items-center justify-center rounded-lg bg-white/10"
          ><app-icon name="sparkles" class="size-4"
        /></span>
        RAGDesk
      </p>
      <div class="relative max-w-md">
        <h2 class="text-4xl leading-tight font-semibold tracking-tight">
          Let your documents answer your customers.
        </h2>
        <p class="mt-4 text-teal-100">
          Upload your docs, paste one script tag on your site, and visitors get answers that stream
          in and cite the exact passage they came from.
        </p>
        <ul class="mt-8 space-y-3 text-sm text-teal-100">
          <li class="flex items-center gap-2">
            <app-icon name="check" class="size-4 text-emerald-300" /> Answers with citations, never
            invented
          </li>
          <li class="flex items-center gap-2">
            <app-icon name="check" class="size-4 text-emerald-300" /> Unanswered questions show what
            docs are missing
          </li>
          <li class="flex items-center gap-2">
            <app-icon name="check" class="size-4 text-emerald-300" /> One embeddable widget, no
            framework needed
          </li>
        </ul>
      </div>
      <p class="relative text-xs text-teal-200">Portfolio project · FastAPI + Angular + Claude</p>
    </aside>
    <main class="flex items-center justify-center bg-white px-6 py-12 dark:bg-slate-950">
      <div class="w-full max-w-sm"><router-outlet /></div>
    </main>
  `,
})
export class AuthLayout {}
