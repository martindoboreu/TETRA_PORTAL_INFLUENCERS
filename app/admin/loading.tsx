import { Skeleton } from '@/components/ui/skeleton'

export default function AdminLoading() {
  return (
    <>
      <div className="sticky top-0 z-30 border-b border-line bg-white/80 px-4 py-4 backdrop-blur-sm sm:px-6 lg:px-8">
        <div className="pl-12 lg:pl-0">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="mt-2 hidden h-4 w-64 sm:block" />
        </div>
      </div>

      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    </>
  )
}
