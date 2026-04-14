export function useSearchDialog() {
  const isOpen = useState<boolean>('search-dialog-open', () => false);
  const query = useState<string>('search-dialog-query', () => '');

  function openSearch(initialQuery = '') {
    query.value = initialQuery;
    isOpen.value = true;
  }

  function closeSearch() {
    isOpen.value = false;
  }

  return {
    isOpen,
    query,
    openSearch,
    closeSearch,
  };
}
