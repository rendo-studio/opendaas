import { AclipApp, stringArgument } from "@rendo-studio/aclip";
import {
  addTask,
  buildTaskTree,
  loadTasks,
  renderTaskTreeLines,
  updateTaskStatus
} from "../../core/tasks.js";

export function registerTaskGroup(app: AclipApp) {
  app
    .group("task", {
      summary: "Manage the structured task tree.",
      description:
        "Create and inspect tree-shaped tasks that always carry an explicit parent reference."
    })
    .command("add", {
      summary: "Add a task node.",
      description:
        "Create a task node in the task tree and require an explicit parent marker or root.",
      arguments: [
        stringArgument("name", {
          required: true,
          description: "Task node name."
        }),
        stringArgument("parent", {
          required: true,
          description: "Parent task id, or root for top-level nodes."
        }),
        stringArgument("plan", {
          required: false,
          description:
            "Optional plan id. Required when creating a root-level task; inherited from the parent task otherwise."
        })
      ],
      examples: [
        "opendaas task add --name 'Wire local site runtime' --parent root --plan implement-local-docs-site-runtime-4",
        "opendaas task add --name 'Add baseline registry' --parent task-site-runtime"
      ],
      handler: async ({ name, parent, plan }) => {
        return addTask({
          name: String(name),
          parent: String(parent),
          plan: plan ? String(plan) : undefined
        });
      }
    })
    .command("update", {
      summary: "Update a task node status.",
      description: "Change a task node status and refresh progress and docs projections.",
      arguments: [
        stringArgument("id", {
          required: true,
          description: "Task id."
        }),
        stringArgument("status", {
          required: true,
          description: "Target status: pending, in_progress, done, or blocked."
        })
      ],
      examples: [
        "opendaas task update --id task-2-1 --status in_progress",
        "opendaas task update --id task-2-1 --status done"
      ],
      handler: async ({ id, status }) => {
        const nextStatus = String(status);
        if (!["pending", "in_progress", "done", "blocked"].includes(nextStatus)) {
          throw new Error(`Unsupported task status "${nextStatus}".`);
        }

        return updateTaskStatus({
          id: String(id),
          status: nextStatus as "pending" | "in_progress" | "done" | "blocked"
        });
      }
    })
    .command("list", {
      summary: "List the current task tree.",
      description: "Inspect the current tree-shaped task structure.",
      examples: ["opendaas task list"],
      handler: async () => {
        const tasks = await loadTasks();
        const tree = buildTaskTree(tasks.items);
        return {
          tasks: tasks.items,
          taskTree: tree,
          lines: renderTaskTreeLines(tree)
        };
      }
    });
}
