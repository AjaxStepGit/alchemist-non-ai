import { useToastContext } from '@/app/components/ui/ToastProvider'

export function useToast() {
    const { showToast } = useToastContext()
    return showToast
}
