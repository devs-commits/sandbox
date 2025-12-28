import { Eye } from "lucide-react";
import { TabsContent} from "../../ui/tabs";
import {
  Table,
  TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../../ui/table";

export default function EnterpriseTab({paginatedData}:{paginatedData : any[]}){
    return(
        <div>
            <TabsContent value="enterprise" className="mt-0">
            <div className="rounded-lg overflow-hidden border border-border/30">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[hsla(273,96%,64%,0.3)] hover:bg-[hsla(273,96%,64%,0.3)]/20">
                    <TableHead className="text-foreground font-semibold">Company Name</TableHead>
                    <TableHead className="text-foreground font-semibold hidden md:table-cell">Subscription Plan</TableHead>
                    <TableHead className="text-foreground font-semibold">Subscription Status</TableHead>
                    <TableHead className="text-foreground font-semibold hidden md:table-cell">Expires On</TableHead>
                    <TableHead className="text-foreground font-semibold hidden lg:table-cell">Days Left</TableHead>
                    <TableHead className="text-foreground font-semibold">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((enterprise: any, index) => (
                    <TableRow key={index} className="border-border/30">
                      <TableCell className="text-foreground">{enterprise.company}</TableCell>
                      <TableCell className="text-muted-foreground hidden md:table-cell">{enterprise.plan}</TableCell>
                      <TableCell>
                        <span className={enterprise.status === "Active" ? "text-emerald-400" : "text-red-400"}>
                          {enterprise.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground hidden md:table-cell">{enterprise.expiresOn}</TableCell>
                      <TableCell className="text-muted-foreground hidden lg:table-cell">{enterprise.daysLeft}</TableCell>
                      <TableCell>
                        <button className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
                          <Eye className="h-4 w-4" />
                          View
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </div>
    )
}