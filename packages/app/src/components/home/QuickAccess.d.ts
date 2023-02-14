interface QuickAccess {
  title: string;
  links: Array<QuickAccessLinks>;
}

interface QuickAccessLinks {
  icon: object;
  iconUrl: string;
  label: string;
  url: string;
}
