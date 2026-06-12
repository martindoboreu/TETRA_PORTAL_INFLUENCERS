import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardLoading() {
  return (
    <>
      <div className="sticky top-0 z-30 border-b border-line bg-white/80 px-4 py-4 backdrop-blur-sm sm:px-6 lg:px-8">
        <div className="pl-12 lg:pl-0">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="mt-2 hidden h-4 w-64 sm:block" />
        </div>
      </div>

      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <div className="grid gap-6 xl:grid-cols-3">
          <Skeleton className="h-72 rounded-2xl xl:col-span-2" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </div>
    </>
  )
}
