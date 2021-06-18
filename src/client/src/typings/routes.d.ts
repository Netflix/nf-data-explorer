import { Route } from 'vue-router/types/router';

export interface IRouteBreadcrumb {
  label: string;
  path: string;
}

type breadcrumbTextFunctionType = (route: Route) => string;
export interface IRouteMetadata {
  breadcrumbText: string | breadcrumbTextFunctionType;
}
