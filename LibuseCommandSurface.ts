import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"

export function useCommandSurface() {
  const [critical, setCritical] = useState(null)
  const [queue, setQueue] = useState([])

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const { data: failures } = await supabase
      .from("overdue_failure_watchdog")
      .select("*")
      .order("obligation_created_at", { ascending: true })
      .limit(1)

    const { data: lifecycle } = await supabase
      .from("projection.obligation_lifecycle")
      .select("*")
      .order("obligation_created_at", { ascending: false })
      .limit(10)

    setCritical(failures?.[0] || null)
    setQueue(lifecycle || [])
  }

  return { critical, queue, reload: load }
}
