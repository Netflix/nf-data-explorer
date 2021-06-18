import { Route } from 'vue-router/types/router';

interface IRouteBreadcrumb {
  label: string;
  path: string;
}

type breadcrumbTextFunctionType = (route: Route) => string;
interface IRouteMetadata {
  breadcrumbText: string | breadcrumbTextFunctionType;
}

/**
 * Builds a list of breadcrumbs from a given route.
 * @param route The route to build breadcrumbs for.
 */
export function buildBreadcrumbsFromRoute(route: Route): IRouteBreadcrumb[] {
  const crumbs: any[] = [];
  route.matched.forEach((routeMatch) => {
    let { breadcrumbText } = routeMatch.meta as IRouteMetadata;
    if (breadcrumbText) {
      if (typeof breadcrumbText === 'function') {
        breadcrumbText = breadcrumbText.call(null, route);
      }
      const pathWithParams = routeMatch.path.replace(
        /:(\w*)/g,
        (_match, pathParam) => route.params[pathParam],
      );
      crumbs.push({ label: breadcrumbText, path: pathWithParams });
    }
  });
  return crumbs;
}
