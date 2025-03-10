import type React from "react"
import { X, Link, ImageIcon, File, ExternalLink, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"

interface ResourceListProps {
  resources: Resource[]
  uploadProgress: { [key: string]: number }
  onRemove: (id: string) => void
  onUpdate: (id: string, field: "title" | "url", value: string) => void
}

const ResourcePreview = ({ resource, progress }: { resource: Resource; progress?: number }) => {
  if (progress !== undefined) {
    return (
      <div className="flex items-center justify-center w-12 h-12 rounded bg-muted">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (resource.type === "image" && resource.fileUrl) {
    return (
      <Image
        src={resource.fileUrl || "/placeholder.svg"}
        alt={resource.title}
        width={48}
        height={48}
        className="w-12 h-12 object-cover rounded"
      />
    )
  }

  const icons = {
    link: <Link className="h-4 w-4" />,
    image: <ImageIcon className="h-4 w-4" />,
    file: <File className="h-4 w-4" />,
  }

  return (
    <div className="flex items-center justify-center w-12 h-12 rounded bg-muted text-muted-foreground">
      {icons[resource.type]}
    </div>
  )
}

export const ResourceList: React.FC<ResourceListProps> = ({ resources, uploadProgress, onRemove, onUpdate }) => {
  const getResourceTypeLabel = (type: Resource["type"]) => {
    const labels = {
      link: "Link",
      image: "Image",
      file: "File",
    }
    return labels[type]
  }

  return (
    <div className="space-y-4">
      {resources.map((resource) => {
        const progress = uploadProgress[resource.id]
        const isUploading = progress !== undefined

        return (
          <div
            key={resource.id}
            className={cn(
              "group relative",
              "flex items-start",
              "p-4 bg-background border",
              "rounded-lg shadow-sm",
              "transition-all duration-200",
              "hover:shadow-md hover:border-primary/20",
              isUploading && "opacity-90",
            )}
          >
            <ResourcePreview resource={resource} progress={progress} />

            <div className="flex-1 ml-4">
              <div className="flex items-center space-x-2 mb-2">
                <Badge variant="secondary">{getResourceTypeLabel(resource.type)}</Badge>
                {isUploading && <span className="text-xs font-medium text-primary">Uploading: {progress}%</span>}
              </div>

              {isUploading && <Progress value={progress} className="h-1 mb-2" />}

              <div className="space-y-2">
                <Input
                  value={resource.title}
                  onChange={(e) => onUpdate(resource.id, "title", e.target.value)}
                  className="flex-1"
                  placeholder={`${getResourceTypeLabel(resource.type)} name`}
                  aria-label={`${getResourceTypeLabel(resource.type)} name`}
                  disabled={isUploading}
                />

                {resource.type === "link" ? (
                  <Input
                    value={resource.url}
                    onChange={(e) => onUpdate(resource.id, "url", e.target.value)}
                    className="flex-1"
                    placeholder="Resource URL"
                    aria-label="Resource URL"
                    disabled={isUploading}
                  />
                ) : (
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <span className="truncate">{resource.fileUrl || "Uploading..."}</span>
                    {resource.fileUrl && !isUploading && (
                      <a
                        href={resource.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80 flex items-center space-x-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span>View</span>
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              onClick={() => onRemove(resource.id)}
              className={cn(
                "p-2 h-auto ml-2",
                "text-muted-foreground hover:text-destructive",
                "opacity-0 group-hover:opacity-100",
                "transition-opacity duration-200",
              )}
              disabled={isUploading}
              aria-label="Remove resource"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )
      })}

      {resources.length === 0 && (
        <div className="text-center py-8 bg-muted/50 rounded-lg border border-dashed">
          <p className="text-muted-foreground">No resources added yet</p>
          <p className="text-muted-foreground/60 text-sm mt-1">
            Add links, images, files, or any other resources to this assignment
          </p>
        </div>
      )}
    </div>
  )
}

export default ResourceList