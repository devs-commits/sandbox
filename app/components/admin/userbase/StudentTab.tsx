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
export default function StudentTab({ paginatedData }: { paginatedData: any[] }) {
  return (
    <div>
    <TabsContent value="students" className="mt-0">
            <div className="rounded-lg overflow-hidden border border-border/30">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[hsla(273,96%,64%,0.3)] hover:bg-[hsla(273,96%,64%,0.3)]/20">
                    <TableHead className="text-foreground font-semibold">Name</TableHead>
                    <TableHead className="text-foreground font-semibold">Email</TableHead>
                    <TableHead className="text-foreground font-semibold ">Course</TableHead>
                    <TableHead className="text-foreground font-semibold ">Subscription Expiration</TableHead>
                    <TableHead className="text-foreground font-semibold ">Phone Number</TableHead>
                    <TableHead className="text-foreground font-semibold">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((student: any, index) => (
                    <TableRow key={index} className="border-border/30">
                      <TableCell className="text-foreground">{student.name}</TableCell>
                      <TableCell className="text-muted-foreground">{student.email}</TableCell>
                      <TableCell className="text-muted-foreground ">{student.course}</TableCell>
                      <TableCell className="text-muted-foreground">{student.expiration}</TableCell>
                      <TableCell className="text-muted-foreground">{student.phone}</TableCell>
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
  );
}