import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { createLink } from '@/shared/api/links'
import { LinkForm } from '@/widgets/LinkForm'
import type { DimensionWithValues } from '@/shared/api/links'

interface AddLinkDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  token: string
  dimensions: DimensionWithValues[]
  setDimensions: (d: DimensionWithValues[]) => void
  onLinkAdded: () => void
}

export default function AddLinkDialog({
  open,
  onOpenChange,
  token,
  dimensions,
  setDimensions,
  onLinkAdded,
}: AddLinkDialogProps) {
  const handleOpenChange = (next: boolean) => {
    if (!next) onOpenChange(false)
  }

  const handleSubmit = async (data: {
    url: string
    title: string
    description?: string
    valueIds: string[]
  }) => {
    try {
      const created = await createLink(token, {
        url: data.url,
        title: data.title,
        description: data.description,
        valueIds: data.valueIds,
      })
      if (created) {
        onLinkAdded()
        handleOpenChange(false)
      }
    } finally {
      /* LinkForm handles submitLoading */
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl gap-3 p-5">
        <DialogHeader className="pb-1">
          <DialogTitle className="text-base">링크 추가</DialogTitle>
        </DialogHeader>
        {open && (
        <LinkForm
          token={token}
          dimensions={dimensions}
          setDimensions={setDimensions}
          onSubmit={handleSubmit}
          onCancel={() => handleOpenChange(false)}
          submitLabel="추가"
        />
        )}
      </DialogContent>
    </Dialog>
  )
}
