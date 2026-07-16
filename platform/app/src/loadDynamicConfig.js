function hydrateBulkDataTransform(transform) {
  if (!transform || typeof transform === 'function') {
    return transform;
  }

  if (transform.type === 'replace' && transform.pattern) {
    const regex = new RegExp(transform.pattern);
    return url => url.replace(regex, transform.replacement ?? '');
  }

  return transform;
}

function hydrateDataSources(config) {
  if (!Array.isArray(config?.dataSources)) {
    return config;
  }

  return {
    ...config,
    dataSources: config.dataSources.map(dataSource => {
      const bulkDataURI = dataSource?.configuration?.bulkDataURI;

      if (!bulkDataURI?.transform) {
        return dataSource;
      }

      return {
        ...dataSource,
        configuration: {
          ...dataSource.configuration,
          bulkDataURI: {
            ...bulkDataURI,
            transform: hydrateBulkDataTransform(bulkDataURI.transform),
          },
        },
      };
    }),
  };
}

export default async config => {
  const useDynamicConfig = config.dangerouslyUseDynamicConfig;

  if (useDynamicConfig?.enabled) {
    const query = new URLSearchParams(window.location.search);
    const configUrl = query.get('configUrl');

    if (configUrl) {
      const regex = useDynamicConfig.regex;

      if (configUrl.match(regex)) {
        const response = await fetch(configUrl, { credentials: 'include' });
        return hydrateDataSources(await response.json());
      } else {
        return null;
      }
    }
  }
  return null;
};
