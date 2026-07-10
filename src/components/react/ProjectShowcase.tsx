import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ExternalLink,
  Calendar,
  Layers,
  CheckCircle2,
  ArrowUpRight,
  Sparkles,
  Code2,
} from "lucide-react";

export interface ProjectItem {
  id: string;
  name: string;
  period: string;
  stack: string[];
  description: string;
  details: string[];
  type: "tech" | "ai";
  link?: string;
  linkLabel?: string;
  highlights?: string[];
}

interface ProjectShowcaseProps {
  projects: ProjectItem[];
}

const ProjectShowcase: React.FC<ProjectShowcaseProps> = ({ projects }) => {
  const [selectedProject, setSelectedProject] =
    React.useState<ProjectItem | null>(null);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        {projects.map((project) => (
          <div
            key={project.id}
            onClick={() => setSelectedProject(project)}
            className="group relative cursor-pointer rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-[var(--color-accent)] overflow-hidden"
          >
            {/* Hover gradient glow */}
            <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <div className="absolute -inset-1 bg-gradient-to-br from-[var(--color-tech)]/5 via-transparent to-[var(--color-interest)]/5 rounded-2xl" />
            </div>

            <div className="relative z-10">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  {project.type === "ai" && (
                    <Sparkles className="h-4 w-4 text-[var(--color-interest)] flex-shrink-0" />
                  )}
                  {project.type === "tech" && (
                    <Code2 className="h-4 w-4 text-[var(--color-tech)] flex-shrink-0" />
                  )}
                  <h3 className="font-bold text-base leading-tight text-[var(--color-text)] group-hover:text-[var(--color-accent)] transition-colors">
                    {project.name}
                  </h3>
                </div>
                <ArrowUpRight className="h-4 w-4 text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)] group-hover:rotate-45 transition-all duration-300 flex-shrink-0" />
              </div>

              <div className="flex items-center gap-2 mb-3 text-xs text-[var(--color-text-muted)]">
                <Calendar className="h-3 w-3" />
                <span>{project.period}</span>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-3">
                {project.stack.slice(0, 4).map((tech) => (
                  <Badge key={tech} variant="secondary" className="text-[10px] py-0.5 px-2">
                    {tech}
                  </Badge>
                ))}
                {project.stack.length > 4 && (
                  <span className="text-[10px] text-[var(--color-text-muted)] py-0.5 px-1">
                    +{project.stack.length - 4}
                  </span>
                )}
              </div>

              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed line-clamp-2">
                {project.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Dialog */}
      <Dialog
        open={!!selectedProject}
        onOpenChange={(open) => !open && setSelectedProject(null)}
      >
        <DialogContent className="max-w-2xl">
          {selectedProject && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-1">
                  {selectedProject.type === "ai" && (
                    <Sparkles className="h-5 w-5 text-[var(--color-interest)]" />
                  )}
                  {selectedProject.type === "tech" && (
                    <Code2 className="h-5 w-5 text-[var(--color-tech)]" />
                  )}
                  <Badge
                    variant={selectedProject.type === "ai" ? "interest" : "tech"}
                    className="text-[10px]"
                  >
                    {selectedProject.type === "ai" ? "AI 项目" : "技术项目"}
                  </Badge>
                </div>
                <DialogTitle className="text-2xl">
                  {selectedProject.name}
                </DialogTitle>
                <DialogDescription className="flex items-center gap-2 mt-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {selectedProject.period}
                </DialogDescription>
              </DialogHeader>

              {/* Tech Stack */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                  <Layers className="h-3.5 w-3.5" />
                  技术栈
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedProject.stack.map((tech) => (
                    <Badge key={tech} variant="outline" className="text-xs">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  {selectedProject.description}
                </p>
              </div>

              {/* Details / Highlights */}
              {selectedProject.details.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    技术要点
                  </div>
                  <ul className="space-y-2">
                    {selectedProject.details.map((detail, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-[var(--color-text-secondary)] leading-relaxed"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[var(--color-accent)] flex-shrink-0" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Highlights */}
              {selectedProject.highlights && selectedProject.highlights.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                    <Sparkles className="h-3.5 w-3.5" />
                    项目亮点
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedProject.highlights.map((hl, i) => (
                      <div
                        key={i}
                        className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-2 text-xs text-[var(--color-text-secondary)]"
                      >
                        {hl}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Link */}
              {selectedProject.link && (
                <div className="pt-2">
                  <a href={selectedProject.link} target="_blank" rel="noopener noreferrer">
                    <Button variant="gradient" size="default" className="w-full">
                      <ExternalLink className="h-4 w-4" />
                      {selectedProject.linkLabel || "访问项目"}
                    </Button>
                  </a>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProjectShowcase;
