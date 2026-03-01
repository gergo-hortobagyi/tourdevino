k8s_yaml(kustomize('infra/k8s/overlays/local'))

docker_build(
  'tourdevino/api:dev',
  '.',
  dockerfile='apps/api/Dockerfile.dev',
  live_update=[
    sync('apps/api/src', '/app/apps/api/src'),
    sync('apps/api/tsconfig.json', '/app/apps/api/tsconfig.json'),
    sync('prisma', '/app/prisma'),
  ],
)

docker_build(
  'tourdevino/web:dev',
  '.',
  dockerfile='apps/web/Dockerfile.dev',
  live_update=[
    sync('apps/web', '/app/apps/web'),
  ],
)

k8s_resource('postgres', port_forwards=['40002:5432'])
k8s_resource('api', port_forwards=['40001:40001'], resource_deps=['postgres'])
k8s_resource('web', port_forwards=['40000:40000'], resource_deps=['api'])
