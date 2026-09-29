import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { createRouter, createHashHistory } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

// 2. Initialize it before the router
const hashHistory = createHashHistory()

export const router = createRouter({
  routeTree,
  // 3. Add these two lines to your existing setup
  basepath: '/WealthSim/',
  history: hashHistory,
  // ... leave any existing routeContext or other settings here
})
export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
