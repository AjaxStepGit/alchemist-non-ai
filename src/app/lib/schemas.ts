import { EntityType } from '@/types/entities'

export const SCHEMAS: Record<EntityType, Record<string, string[]>> = {
    clients: {
        ClientID: ['clientid', 'id', 'client_id', 'custid'],
        ClientName: ['clientname', 'customer', 'client_name', 'cust_name'],
        PriorityLevel: ['prioritylevel', 'priority', 'prio', 'level'],
        RequestedTaskIDs: [
            'requestedtaskids',
            'task_ids',
            'tasks',
            'requested_tasks',
        ],
        GroupTag: ['grouptag', 'group', 'group_tag'],
        AttributesJSON: ['attributesjson', 'attributes', 'meta', 'metadata'],
    },
    workers: {
        WorkerID: ['workerid', 'id', 'worker_id', 'staffid'],
        WorkerName: ['workername', 'name', 'worker_name'],
        Skills: ['skills', 'skillset', 'skill_tags'],
        AvailableSlots: [
            'availableslots',
            'available_slots',
            'slots',
            'phases',
        ],
        MaxLoadPerPhase: ['maxloadperphase', 'max_load', 'maxload'],
        WorkerGroup: ['workergroup', 'group', 'team'],
        QualificationLevel: [
            'qualificationlevel',
            'qualification',
            'quallevel',
        ],
    },
    tasks: {
        TaskID: ['taskid', 'id', 'task_id'],
        TaskName: ['taskname', 'name', 'task_name'],
        Category: ['category', 'type', 'task_category'],
        Duration: ['duration', 'length', 'phases'],
        RequiredSkills: ['requiredskills', 'skills_required', 'req_skills'],
        PreferredPhases: ['preferredphases', 'preferred_phases', 'phases'],
        MaxConcurrent: ['maxconcurrent', 'max_concurrent', 'concurrency'],
    },
    unknown: {},
}
